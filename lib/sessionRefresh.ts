import { supabase } from "./supabase";

/**
 * Attempts to refresh the auth session without blocking forever.
 * Never signs the user out — Supabase's autoRefreshToken handles genuine
 * expiry via the onAuthStateChange SIGNED_OUT event. Manually signing out
 * here cancels in-flight queries and creates a bad UX loop.
 */
export async function refreshSessionWithTimeout(timeoutMs = 5000): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await Promise.race([
    supabase.auth.refreshSession().then(({ error }) => {
      if (error) {
        // Log only — do NOT sign out. The Supabase client's autoRefreshToken
        // will emit SIGNED_OUT via onAuthStateChange if the token is truly dead.
        console.warn("[sessionRefresh] refresh failed:", error.message);
      }
    }),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
