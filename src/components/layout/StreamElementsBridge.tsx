import { useQuery } from "@tanstack/react-query";

import { getStreamElementsToken } from "@/lib/connections.functions";
import { useStreamElementsSocket } from "@/hooks/useStreamElementsSocket";

/**
 * Keeps the StreamElements realtime connection alive while the dashboard is
 * open so tips and alerts flow into the timer and activity feed.
 */
export function StreamElementsBridge({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["streamelements-token", userId],
    staleTime: 5 * 60 * 1000,
    queryFn: () => getStreamElementsToken(),
  });

  useStreamElementsSocket(data?.token ?? null);
  return null;
}
