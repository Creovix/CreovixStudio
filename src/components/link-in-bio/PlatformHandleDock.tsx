import { useState } from "react";

import { LinkInBioPlatformLogo } from "@/components/link-in-bio/LinkInBioPlatformLogo";
import { PlatformLivePreview } from "@/components/link-in-bio/PlatformLivePreview";
import { Input } from "@/components/ui/input";
import type { HandleMap } from "@/hooks/useLinkInBioDraft";
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

function platformHint(id: LinkPlatform, value: string, filled: boolean) {
  if (id === "whatsapp") {
    if (!value) return "Community or group invite link — not a phone number";
    return sanitizeWhatsappCommunityUrl(value)
      ? value
      : "Use chat.whatsapp.com/… or whatsapp.com/channel/…";
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
  if (id === "tiktok") return "@you or tiktok.com/@you/video/…";
  if (id === "x") return "@you or x.com/you/status/…";
  if (id === "discord") return "discord.gg/invite";
  if (fullUrl) return hint;
  return "handle";
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
  const firstFilled = platforms.find((platform) => handles[platform.id])?.id ?? null;
  const [openId, setOpenId] = useState<LinkPlatform | null>(firstFilled);
  const open = platforms.find((platform) => platform.id === openId) ?? null;
  const value = open ? handles[open.id] : "";
  const filled = Boolean(value);
  const fullUrl = open ? usesFullUrl(open.id) : false;
  const whatsappInvalid = open?.id === "whatsapp" && Boolean(value) && !sanitizeWhatsappCommunityUrl(value);
  const accent = open ? platformAccent(open.id) : null;
  const inspector = tone === "inspector";
  const linkFavicon = customFavicon(handles.custom);

  const toggle = (id: LinkPlatform) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="grid gap-3">
      <div
        className="flex gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Platforms"
      >
        {platforms.map((platform) => {
          const active = openId === platform.id;
          const hasValue = Boolean(handles[platform.id]);
          return (
            <button
              key={platform.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={platform.label}
              title={platform.label}
              onClick={() => toggle(platform.id)}
              className={cn(
                "flex w-6 shrink-0 flex-col items-center gap-1.5 rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-none focus-visible:opacity-100",
                "transition-[transform,opacity]",
                active ? "scale-110 opacity-100" : "opacity-75 hover:scale-105 hover:opacity-100",
                inspector && "w-5",
              )}
            >
              <LinkInBioPlatformLogo
                platform={platform.id}
                size={inspector ? 20 : 24}
                faviconUrl={platform.id === "custom" ? linkFavicon : null}
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
              platform={open.id}
              size={24}
              faviconUrl={open.id === "custom" ? customFavicon(value) : null}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{open.label}</p>
              <p className="truncate text-[0.68rem] text-white/40" dir="auto">
                {platformHint(open.id, value, filled)}
              </p>
            </div>
          </div>
          <Input
            key={open.id}
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
            placeholder={fieldPlaceholder(open.id, open.hint, fullUrl)}
            value={value}
            onChange={(event) => {
              const next = event.target.value;
              const keepRaw = fullUrl || looksLikeHttpUrl(next);
              onChange({
                ...handles,
                [open.id]: keepRaw ? next : sanitizeHandle(next),
              });
            }}
          />
          <PlatformLivePreview platform={open.id} value={value} compact={inspector} />
        </div>
      ) : (
        <p className={cn("text-[0.68rem] leading-relaxed", inspector ? "text-muted-foreground" : "text-white/40")}>
          Tap an icon to add or edit a handle. Other platforms stay saved.
        </p>
      )}
    </div>
  );
}
