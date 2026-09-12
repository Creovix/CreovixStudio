import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  checkTestSlugAvailable,
  DEFAULT_PROFILE,
  DEFAULT_THEME,
  handleFromUrl,
  linkToInput,
  loadTestLinkInBio,
  publicLinkInBioPayload,
  replaceTestLinks,
  saveTestLinkInBio,
  sanitizeHandle,
  sanitizeSlug,
  slugError,
  urlFromHandle,
  type LinkInBioLink,
  type LinkInBioProfile,
  type LinkInBioState,
  type LinkInBioTheme,
  type LinkPlatform,
} from "@/lib/linkInBio";
import {
  checkLinkInBioSlug,
  getLinkInBioState,
  previewLinkInBioStream,
  replaceLinkInBioLinks,
  saveLinkInBioProfile,
  saveLinkInBioTheme,
} from "@/lib/linkInBio.functions";
import { loadTestSchedule } from "@/lib/schedule";
import { isTestMode } from "@/lib/testMode";

export type HandleMap = Record<LinkPlatform, string>;

export const EMPTY_HANDLES: HandleMap = {
  kick: "",
  twitch: "",
  youtube: "",
  tiktok: "",
  instagram: "",
  x: "",
  discord: "",
  custom: "",
};

export function handlesFromLinks(links: LinkInBioLink[]): HandleMap {
  const next = { ...EMPTY_HANDLES };
  for (const link of links) {
    if (link.kind === "gallery") continue;
    next[link.platform] = handleFromUrl(link.platform, link.url);
  }
  return next;
}

export function linksFromHandles(handles: HandleMap, previous: LinkInBioLink[]): LinkInBioLink[] {
  const now = new Date().toISOString();
  const platformLinks = (Object.keys(handles) as LinkPlatform[]).flatMap((platform) => {
    const value = handles[platform].trim();
    if (!value) return [];
    const url = urlFromHandle(platform, value);
    if (!url) return [];
    const existing = previous.find((link) => link.kind === "link" && link.platform === platform);
    return [
      {
        id: existing?.id ?? crypto.randomUUID(),
        title: existing?.title || platformLabel(platform),
        url,
        platform,
        cardSize: existing?.cardSize ?? "inherit",
        sortOrder: existing?.sortOrder ?? 0,
        featured: existing?.featured ?? false,
        enabled: true,
        kind: "link" as const,
        gridX: existing?.gridX ?? 0,
        gridY: existing?.gridY ?? 0,
        colSpan: existing?.colSpan ?? 1,
        rowSpan: existing?.rowSpan ?? 1,
        galleryImages: [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      } satisfies LinkInBioLink,
    ];
  });
  const galleries = previous.filter((link) => link.kind === "gallery");
  return [...platformLinks, ...galleries].map((link, index) => ({ ...link, sortOrder: index }));
}

function platformLabel(platform: LinkPlatform) {
  if (platform === "kick") return "Kick";
  if (platform === "twitch") return "Twitch";
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  if (platform === "instagram") return "Instagram";
  if (platform === "x") return "X";
  if (platform === "discord") return "Discord";
  return "Link";
}

export function useLinkInBioDraft(userId: string) {
  const test = isTestMode();
  const queryClient = useQueryClient();
  const loadLive = useServerFn(getLinkInBioState);
  const persistProfile = useServerFn(saveLinkInBioProfile);
  const persistTheme = useServerFn(saveLinkInBioTheme);
  const persistLinks = useServerFn(replaceLinkInBioLinks);
  const checkSlug = useServerFn(checkLinkInBioSlug);
  const loadStream = useServerFn(previewLinkInBioStream);

  const stateQuery = useQuery({
    queryKey: ["link-in-bio", userId, test],
    queryFn: async (): Promise<LinkInBioState> => {
      if (!test) return loadLive();
      const stored = loadTestLinkInBio();
      const schedule = loadTestSchedule();
      return {
        ...stored,
        scheduleShareToken: schedule.settings.shareToken || stored.scheduleShareToken,
        scheduleTitle: schedule.settings.title || stored.scheduleTitle,
      };
    },
  });

  const streamQuery = useQuery({
    queryKey: ["link-in-bio-stream", userId, test],
    enabled: !test && Boolean(stateQuery.data),
    queryFn: () => loadStream(),
    staleTime: 60_000,
  });

  const [profile, setProfile] = useState<LinkInBioProfile>(DEFAULT_PROFILE);
  const [theme, setTheme] = useState<LinkInBioTheme>(DEFAULT_THEME);
  const [links, setLinks] = useState<LinkInBioLink[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const slugTimer = useRef(0);

  useEffect(() => {
    if (hydrated) return;
    if (stateQuery.data) {
      setProfile(stateQuery.data.profile);
      setTheme(stateQuery.data.theme);
      setLinks(stateQuery.data.links);
      setHydrated(true);
      return;
    }
    if (stateQuery.isFetched) setHydrated(true);
  }, [stateQuery.data, stateQuery.isFetched, hydrated]);

  const preview = useMemo(
    () =>
      publicLinkInBioPayload(
        {
          profile,
          theme,
          links,
          kickUsername: stateQuery.data?.kickUsername ?? null,
          twitchUsername: stateQuery.data?.twitchUsername ?? null,
          scheduleShareToken: stateQuery.data?.scheduleShareToken ?? null,
          scheduleTitle: stateQuery.data?.scheduleTitle ?? null,
        },
        test ? undefined : streamQuery.data,
      ),
    [profile, theme, links, stateQuery.data, streamQuery.data, test],
  );

  const persist = async (
    nextProfile = profile,
    nextTheme = theme,
    nextLinks = links,
  ) => {
    if (test) {
      saveTestLinkInBio({
        profile: nextProfile,
        theme: nextTheme,
        links: nextLinks,
        kickUsername: stateQuery.data?.kickUsername ?? null,
        twitchUsername: stateQuery.data?.twitchUsername ?? null,
        scheduleShareToken: stateQuery.data?.scheduleShareToken ?? null,
        scheduleTitle: stateQuery.data?.scheduleTitle ?? null,
      });
      replaceTestLinks(nextLinks.map(linkToInput));
      return;
    }
    const profileResult = await persistProfile({
      data: { ...nextProfile, slug: sanitizeSlug(nextProfile.slug) },
    });
    if (!profileResult.ok) throw new Error(profileResult.error);
    const themeResult = await persistTheme({ data: nextTheme });
    if (!themeResult.ok) throw new Error(themeResult.error);
    const linksResult = await persistLinks({ data: { links: nextLinks.map(linkToInput) } });
    if (!linksResult.ok) throw new Error(linksResult.error);
  };

  const save = useMutation({
    mutationFn: async (payload?: { profile?: LinkInBioProfile; theme?: LinkInBioTheme; links?: LinkInBioLink[] }) => {
      const nextProfile = payload?.profile ?? profile;
      const nextTheme = payload?.theme ?? theme;
      const nextLinks = payload?.links ?? links;
      await persist(nextProfile, nextTheme, nextLinks);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["link-in-bio", userId, test] }),
    onError: (error: Error) => {
      toast.error(
        error.message === "slug_taken"
          ? "That username is taken."
          : error.message === "slug_reserved" || error.message === "slug_invalid" || error.message === "slug_required"
            ? "Choose a valid public username."
            : "Could not save.",
      );
    },
  });

  useEffect(() => {
    const slug = sanitizeSlug(profile.slug);
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    const invalid = slugError(slug);
    if (invalid) {
      setSlugStatus("invalid");
      return;
    }
    window.clearTimeout(slugTimer.current);
    slugTimer.current = window.setTimeout(() => {
      setSlugStatus("checking");
      if (test) {
        const result = checkTestSlugAvailable(slug, stateQuery.data?.profile.slug ?? "");
        setSlugStatus(result.available ? "available" : result.error === "slug_taken" ? "taken" : "invalid");
        return;
      }
      void checkSlug({ data: { slug } }).then((result) => {
        setSlugStatus(result.available ? "available" : result.error === "slug_taken" ? "taken" : "invalid");
      });
    }, 320);
    return () => window.clearTimeout(slugTimer.current);
  }, [profile.slug, test, checkSlug, stateQuery.data?.profile.slug]);

  const applyHandles = (handles: HandleMap) => {
    setLinks(linksFromHandles(handles, links));
  };

  return {
    test,
    loading: !hydrated,
    state: stateQuery.data,
    profile,
    setProfile,
    theme,
    setTheme,
    links,
    setLinks,
    preview,
    slugStatus,
    save,
    persist,
    applyHandles,
    sanitizeHandle,
  };
}
