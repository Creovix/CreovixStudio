import type { PostLoginServerNext } from "@/lib/postLogin";

/**
 * Server-side post-login hint after OAuth session mint.
 * Does not know about the client gateway localStorage flag — the client still
 * prefers `/welcome` when onboarding is incomplete.
 */
export async function resolvePostLoginNext(userId: string): Promise<PostLoginServerNext> {
  const { supabaseAdmin } = await import("@/lib/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("platform_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("access_token", "is", null)
    .limit(1);

  if (error) {
    console.warn("[postLogin] server connection check failed", error.message);
    return "dashboard";
  }

  return (data?.length ?? 0) > 0 ? "dashboard" : "settings";
}
