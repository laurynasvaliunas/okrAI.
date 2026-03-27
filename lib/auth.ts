import { supabase } from "./supabase";
import { logOutPurchases } from "./purchases";

// Converts any thrown value (including Supabase's PostgrestError plain objects)
// into a real Error instance so instanceof checks work everywhere.
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  const raw = e as Record<string, unknown>;
  const msg = typeof raw?.message === "string" ? raw.message : "Unknown error";
  return Object.assign(new Error(msg), e);
}

// Maps Supabase auth error codes/messages to user-friendly strings.
function friendlyAuthMessage(err: Error): string {
  const msg = err.message ?? "";
  const code = (err as unknown as Record<string, unknown>)?.code as string | undefined;

  if (
    code === "user_already_exists" ||
    code === "email_address_not_authorized" ||
    msg.includes("User already registered") ||
    msg.includes("already been registered")
  ) {
    return "An account with this email already exists.";
  }
  if (code === "weak_password" || msg.includes("weak_password") || msg.includes("Password should")) {
    return "Password is too weak. Please choose a stronger one.";
  }
  if (
    code === "invalid_credentials" ||
    code === "invalid_login_credentials" ||
    msg.includes("Invalid login credentials") ||
    msg.includes("invalid_credentials")
  ) {
    return "Incorrect email or password.";
  }
  if (code === "email_not_confirmed" || msg.includes("Email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox.";
  }
  if (msg.includes("NetworkError") || msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    const wrapped = toError(error);
    console.error("[Auth] signIn error:", error);
    wrapped.message = friendlyAuthMessage(wrapped);
    throw wrapped;
  }
  return data;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: "okrai-personal://auth/callback",
    },
  });

  if (error) {
    const wrapped = toError(error);
    console.error("[Auth] signUp error:", error);
    wrapped.message = friendlyAuthMessage(wrapped);
    throw wrapped;
  }

  // When email confirmation is required, data.session is null and the client
  // is still anonymous — inserting into profiles would fail RLS. Skip the
  // insert here; _layout.tsx will upsert the profile on first confirmed login.
  if (data.session && data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: fullName,
      account_type: "personal",
      onboarding_completed: false,
    });
    if (profileError) {
      console.error("[Auth] profile insert error:", profileError);
      throw toError(profileError);
    }
  }

  return data;
}

export async function signOut() {
  await logOutPurchases();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Auth] signOut error:", error);
    throw toError(error);
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Auth] getSession error:", error);
    throw toError(error);
  }
  return data.session;
}
