import { isGatewayCompleted } from "@/lib/plans";
import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTestMode } from "@/lib/testMode";

/** Where to send the user after a successful sign-in. */
export type PostLoginTo = "/welcome" | "/dashboard" | "/settings";

export type PostLoginDestination = {
  to: PostLoginTo;
  search?: { setup?: "connections"; connected?: string };
};

/** Hint from `/api/auth/session/finish` based on server-side connection state. */
export type PostLoginServerNext = "dashboard" | "settings";

/**
 * Decide the post-login route:
 * 1. Gateway (plan / redeem) not finished → `/welcome`
 * 2. No active streaming connection with a token → `/settings` (Connections)
 * 3. Otherwise → `/dashboard`
 *
 * Prefer this over a bare `isGatewayCompleted() ? /dashboard : /welcome` so
 * returning users still get guided when tokens/links are missing.
 */
export async function resolvePostLoginPath(options?: {
  serverNext?: PostLoginServerNext | null;
}): Promise<PostLoginDestination> {
  if (!isGatewayCompleted()) {
    return { to: "/welcome" };
  }

  if (options?.serverNext === "settings") {
    return { to: "/settings", search: { setup: "connections" } };
  }

  if (isTestMode()) {
    return { to: "/dashboard" };
  }

  if (!isSupabaseConfigured()) {
    return { to: "/welcome" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { to: "/welcome" };
  }

  const hasConnection = await userHasActivePlatformConnection(user.id);
  if (!hasConnection) {
    return { to: "/settings", search: { setup: "connections" } };
  }

  return { to: "/dashboard" };
}

export async function userHasActivePlatformConnection(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .not("access_token", "is", null)
    .limit(1);
  if (error) {
    console.warn("[postLogin] connection check failed", error.message);
    // Fail open to dashboard only when gateway is already done — caller still
    // prefers welcome when the gateway flag is unset.
    return true;
  }
  return (data?.length ?? 0) > 0;
}
