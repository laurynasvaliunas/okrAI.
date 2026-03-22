/**
 * Maps errors (including Supabase PostgrestError) to user-friendly messages.
 * Never exposes raw Supabase/network error strings to users.
 */
export function getFriendlyErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!err || typeof err !== "object") return fallback;

  const msg = (err as { message?: string }).message ?? "";
  const code = (err as { code?: string }).code ?? "";

  // Supabase/Postgrest errors
  if (code === "PGRST116" || msg.includes("not found") || msg.includes("0 rows")) {
    return "The requested item was not found.";
  }
  if (code === "23505" || msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "This item already exists.";
  }
  if (code === "23503" || msg.includes("foreign key")) {
    return "This action cannot be completed. Please try again.";
  }
  if (code === "42501" || msg.includes("permission denied") || msg.includes("row-level security")) {
    return "You don't have permission to perform this action.";
  }
  // Column / schema errors — usually a code bug, surface as generic
  if (code === "42703" || msg.includes("does not exist") || msg.includes("column")) {
    return fallback;
  }
  // Not-null constraint
  if (code === "23502" || msg.includes("violates not-null constraint")) {
    return fallback;
  }
  // Check constraint
  if (code === "23514" || msg.includes("violates check constraint")) {
    return fallback;
  }
  // Invalid JWT / auth
  if (msg.toLowerCase().includes("invalid jwt") || msg.toLowerCase().includes("jwt expired")) {
    return "Your session has expired. Please sign out and sign back in.";
  }

  // Network
  if (msg.includes("NetworkError") || msg.includes("network") || msg.includes("fetch") || msg.includes("Failed to fetch")) {
    return "Network error. Check your connection and try again.";
  }

  // Auth errors are handled by lib/auth.ts friendlyAuthMessage — this is for non-auth flows
  return fallback;
}
