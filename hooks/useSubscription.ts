import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import {
  getSubscriptionStatus,
  FREE_LIMITS,
  type SubscriptionStatus,
} from "../lib/subscription";

const QUERY_KEY = (userId: string | undefined) => ["subscription", userId];

export function useSubscription() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<SubscriptionStatus>({
    queryKey: QUERY_KEY(userId),
    queryFn: getSubscriptionStatus,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIsPro(): boolean {
  const { data } = useSubscription();
  return data?.isPro ?? false;
}

export function useCanCreateObjective(currentCount: number): boolean {
  const isPro = useIsPro();
  if (isPro) return true;
  return currentCount < FREE_LIMITS.maxObjectives;
}

export function useRefreshSubscription() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return async function refresh() {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY(userId) });
  };
}
