import { supabase } from "./supabase";
import { refreshSessionWithTimeout } from "./sessionRefresh";

type InvokeBody = {
  message: string;
  userId: string;
  context: string;
  userName: string | undefined;
  conversation: { role: "user" | "assistant"; content: string }[];
};

/**
 * Edge Functions verify JWT at the gateway. Stale/expired access tokens cause "Invalid JWT".
 * Refresh session before invoke; use a timeout so refresh never blocks the UI forever.
 */
export async function invokePersonalCoach(body: InvokeBody) {
  await refreshSessionWithTimeout(5000);
  return supabase.functions.invoke("personal-coach", { body });
}
