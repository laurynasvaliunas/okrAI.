/**
 * Supabase `functions.invoke` sets `data` to null when the Edge Function returns non-2xx.
 * The JSON body (e.g. `{ error: "..." }`) is on `FunctionsHttpError.context` as a Response.
 */
export async function getMessageFromFunctionsHttpError(
  error: unknown
): Promise<string | null> {
  if (!error || typeof error !== "object") return null;

  const ctx = (error as { context?: unknown }).context;
  if (!ctx || typeof (ctx as Response).text !== "function") {
    return null;
  }

  const res = ctx as Response;
  try {
    const raw = await res.clone().text();
    if (!raw) return null;
    try {
      const j = JSON.parse(raw) as { error?: string; message?: string };
      if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
      if (typeof j.message === "string" && j.message.trim()) return j.message.trim();
    } catch {
      return raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
    }
  } catch {
    return null;
  }
  return null;
}
