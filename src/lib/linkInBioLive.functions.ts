import { createServerFn } from "@tanstack/react-start";

import { sanitizePlatform } from "@/lib/linkInBio";
import { requireSupabaseAuth } from "@/lib/supabase/auth-middleware";

export const previewPlatformLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; value: string }) => ({
    platform: sanitizePlatform(input.platform),
    value: String(input.value ?? "").trim().slice(0, 2048),
  }))
  .handler(async ({ data }) => {
    const { previewPlatformLive: load } = await import("@/lib/linkInBioLive.server");
    return load(data.platform, data.value);
  });
