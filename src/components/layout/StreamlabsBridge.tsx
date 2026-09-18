import { useQuery } from "@tanstack/react-query";

import { getStreamlabsSocketToken } from "@/lib/connections.functions";
import { useStreamlabsSocket } from "@/hooks/useStreamlabsSocket";

/**
 * Keeps the Streamlabs Socket API connection alive while the dashboard is open
 * so tips, subs, bits, follows and raids flow into the timer and activity feed.
 */
export function StreamlabsBridge({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["streamlabs-socket-token", userId],
    staleTime: 5 * 60 * 1000,
    queryFn: () => getStreamlabsSocketToken(),
  });

  useStreamlabsSocket(data?.token ?? null);
  return null;
}
