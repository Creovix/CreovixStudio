import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTestUser, isTestMode } from "@/lib/testMode";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (isTestMode()) return { user: getTestUser() };
    if (!isSupabaseConfigured()) throw redirect({ to: "/login" });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
