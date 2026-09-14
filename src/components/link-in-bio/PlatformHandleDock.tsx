import { useMemo, useState } from "react";

import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import { PlatformLivePreview } from "@/components/link-in-bio/PlatformLivePreview";
import { Input } from "@/components/ui/input";
import {
  normalizeCustomDrafts,
  type CustomLinkDraft,
  type HandleMap,
  type SocialPlatform,
} from "@/hooks/useLinkInBioDraft";
import {
  coerceHttpUrl,
  googleFaviconUrl,
  hostnameFromLink,
  LINK_PLATFORMS,
  looksLikeHttpUrl,
  platformAccent,
  sanitizeHandle,
  sanitizeWhatsappCommunityUrl,
  urlFromHandle,
  usesFullUrl,
  type LinkPlatform,
} from "@/lib/linkInBio";
import { cn } from "@/lib/utils";

type PlatformMeta = (typeof LINK_PLATFORMS)[number];

type DockItem =
  | { key: SocialPlatform; platform: SocialPlatform; label: string; hint: string }
  | { key: string; platform: "custom"; slot: CustomLinkDraft; label: string; hint: string };

type OpenKey = string;

function platformHint(id: LinkPlatform, value: string, filled: boolean) {
  if (id === "whatsapp") {
    if (!value) return "Community or group invite link — not a phone number";
    return sanitizeWhatsappCommunityUrl(value)
      ? value
      : "Use chat.whatsapp.com/… or whatsapp.com/channel/…";
  }
  if (id === "custom") {
    const host = hostnameFromLink(value);
    if (host) return host;
    return filled ? value : "https://…";
  }
  if (filled && !usesFullUrl(id) && !looksLikeHttpUrl(value)) return urlFromHandle(id, value);
  return LINK_PLATFORMS.find((item) => item.id === id)?.hint ?? "";
}

function customFavicon(value: string): string | null {
  const host = hostnameFromLink(coerceHttpUrl(value) || value);
  return host ? googleFaviconUrl(host) : null;
}

function fieldPlaceholder(id: LinkPlatform, hint: string, fullUrl: boolean) {
  if (id === "whatsapp") return "https://chat.whatsapp.com/… or whatsapp.com/channel/…";
  if (id === "instagram") return "@you or instagram.com/p/…";
  if (id === "snapchat") return "@you or snapchat.com/add/…";
  if (id === "tiktok") return "@you or tiktok.com/@you/video/…";
  if (id === "x") return "@you or x.com/you/status/…";
  if (id === "discord") return "discord.gg/invite";
  if (fullUrl) return hint;
  return "handle";
}

function dockItems(platforms: ReadonlyArray<PlatformMeta>, handles: HandleMap): DockItem[] {
  return platforms.flatMap((platform) => {
    if (platform.id !== "custom") {
      return [
        {
          key: platform.id,
          platform: platform.id,
          label: platform.label,
          hint: platform.hint,
        } satisfies DockItem,
      ];
    }
    return (handles.custom.length > 0 ? handles.custom : [{ id: "custom-empty", url: "" }]).map(
      (slot, index) => ({
        key: `custom:${slot.id}`,
        platform: "custom" as const,
        slot,
        label: index === 0 ? "Link" : `Link ${index + 1}`,
        hint: platform.hint,
      }),
    );
  });
}

export function PlatformHandleDock({
  platforms,
  handles,
  onChange,
  tone = "wizard",
}: {
  platforms: ReadonlyArray<PlatformMeta>;
  handles: HandleMap;
  onChange: (next: HandleMap) => void;
  tone?: "wizard" | "inspector";
}) {
  const items = useMemo(() => dockItems(platforms, handles), [platforms, handles]);
  const firstFilled = items.find((item) =>
    item.platform === "custom" ? Boolean(item.slot.url) : Boolean(handles[item.platform]),
  )?.key;
  const [openKey, setOpenKey] = useState<OpenKey | null>(firstFilled ?? null);
  const open = items.find((item) => item.key === openKey) ?? null;
  const value =
    open?.platform === "custom" ? open.slot.url : open ? handles[open.platform] : "";
  const filled = Boolean(value);
  const fullUrl = open ? usesFullUrl(open.platform) : false;
  const whatsappInvalid =
    open?.platform === "whatsapp" && Boolean(value) && !sanitizeWhatsappCommunityUrl(value);
  const accent = open ? platformAccent(open.platform) : null;
  const inspector = tone === "inspector";

  const toggle = (key: OpenKey) => {
    setOpenKey((current) => (current === key ? null : key));
  };

  const patchSocial = (id: SocialPlatform, nextValue: string) => {
    onChange({ ...handles, [id]: nextValue });
  };

  const patchCustom = (slotId: string, nextValue: string) => {
    const custom = normalizeCustomDrafts(
      (handles.custom.length > 0 ? handles.custom : [{ id: slotId, url: "" }]).map((slot) =>
        slot.id === slotId ? { ...slot, url: nextValue } : slot,
      ),
    );
    onChange({ ...handles, custom });
  };

  return (
    <div className="grid gap-3">
      <div
        className="flex gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Platforms"
      >
        {items.map((item) => {
          const active = openKey === item.key;
          const hasValue = item.platform === "custom" ? Boolean(item.slot.url) : Boolean(handles[item.platform]);
          const favicon = item.platform === "custom" ? customFavicon(item.slot.url) : null;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              title={item.label}
              onClick={() => toggle(item.key)}
              className={cn(
                "flex w-6 shrink-0 flex-col items-center gap-1.5 rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-none focus-visible:opacity-100",
                "transition-[transform,opacity]",
                active ? "scale-110 opacity-100" : "opacity-75 hover:scale-105 hover:opacity-100",
                inspector && "w-5",
              )}
            >
              <LinkInBioPlatformLogo
                platform={item.platform}
                size={inspector ? 20 : 24}
                faviconUrl={favicon}
              />
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-white" : hasValue ? "bg-white/70" : "bg-transparent",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {open && accent ? (
        <div
          className={cn(
            "rounded-[1.35rem] border p-5 backdrop-blur-xl",
            inspector && "rounded-xl p-4",
            filled && !whatsappInvalid
              ? "border-white/12 bg-white/[0.06]"
              : "border-[rgba(255,255,255,0.08)] bg-white/[0.035]",
            whatsappInvalid && "border-rose-400/35",
          )}
          style={
            filled && !whatsappInvalid
              ? {
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent.css} 38%, transparent), 0 18px 36px -28px ${accent.css}`,
                }
              : undefined
          }
        >
          <div className="mb-4 flex items-center gap-3">
            <LinkInBioPlatformLogo
              platform={open.platform}
              size={24}
              faviconUrl={open.platform === "custom" ? customFavicon(value) : null}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{open.label}</p>
              <p className="truncate text-[0.68rem] text-white/40" dir="auto">
                {platformHint(open.platform, value, filled)}
              </p>
            </div>
          </div>
          <Input
            key={open.key}
            autoFocus
            className={
              inspector
                ? "h-9"
                : "h-10 rounded-2xl border-[rgba(255,255,255,0.08)] bg-black/35 text-sm placeholder:text-white/25 focus-visible:border-white/40 focus-visible:ring-2"
            }
            style={
              inspector
                ? undefined
                : { ["--tw-ring-color" as string]: `color-mix(in oklab, ${accent.css} 55%, white)` }
            }
            dir="auto"
            placeholder={fieldPlaceholder(open.platform, open.hint, fullUrl)}
            value={value}
            onChange={(event) => {
              const next = event.target.value;
              if (open.platform === "custom") {
                patchCustom(open.slot.id, next);
                return;
              }
              const keepRaw = fullUrl || looksLikeHttpUrl(next);
              patchSocial(open.platform, keepRaw ? next : sanitizeHandle(next));
            }}
          />
          <PlatformLivePreview platform={open.platform} value={value} compact={inspector} />
        </div>
      ) : (
        <p className={cn("text-[0.68rem] leading-relaxed", inspector ? "text-muted-foreground" : "text-white/40")}>
          Tap an icon to add or edit a handle. Other platforms stay saved.
        </p>
      )}
    </div>
  );
}
