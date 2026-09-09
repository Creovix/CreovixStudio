import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Subathon = {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  initial_seconds: number;
  max_duration_seconds: number | null;
  overlays: { public_token: string; is_public: boolean }[];
};

/** Profile + subathons + connections — the data every dashboard screen needs. */
export function useWorkspace(userId: string) {
  return useQuery({
    queryKey: ["workspace", userId],
    queryFn: async () => {
      const [profile, connections, subathons] = await Promise.all([
        supabase.from("users").select("name, email, image, timezone").eq("id", userId).maybeSingle(),
        supabase
          .from("platform_connections")
          .select(
            "id, platform, username, is_active, token_expires_at, scopes, platform_user_id, metadata, created_at",
          )
          .order("created_at", { ascending: true }),
        supabase
          .from("subathons")
          .select(
            "id, title, slug, is_active, initial_seconds, max_duration_seconds, overlays(public_token, is_public)",
          )
          .order("is_active", { ascending: false })
          .order("created_at", { ascending: true }),
      ]);
      if (profile.error) throw profile.error;
      if (connections.error) throw connections.error;
      if (subathons.error) throw subathons.error;
      return {
        profile: profile.data,
        connections: connections.data ?? [],
        subathons: (subathons.data ?? []) as Subathon[],
      };
    },
  });
}

/** Aggregate counters for the dashboard stat row. */
export function useSubathonStats(subathonId: string | null) {
  return useQuery({
    enabled: Boolean(subathonId),
    queryKey: ["subathon-stats", subathonId],
    queryFn: async () => {
      const [timer, events, rules] = await Promise.all([
        supabase
          .from("timer_states")
          .select("total_added_seconds")
          .eq("subathon_id", subathonId!)
          .maybeSingle(),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("subathon_id", subathonId!),
        supabase
          .from("rules")
          .select("id", { count: "exact", head: true })
          .eq("subathon_id", subathonId!)
          .eq("is_enabled", true),
      ]);
      return {
        totalAddedSeconds: timer.data?.total_added_seconds ?? 0,
        totalEvents: events.count ?? 0,
        activeRules: rules.count ?? 0,
      };
    },
  });
}
