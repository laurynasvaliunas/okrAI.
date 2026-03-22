/**
 * Auth callback for deep links (email confirmation, magic link, password reset).
 * Configure Supabase redirect URL as: okrai-personal://auth/callback
 * (Add to Supabase Dashboard → Auth → URL Configuration → Redirect URLs)
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../constants/theme";

function parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string; error?: string } {
  try {
    const hashPart = url.includes("#") ? url.split("#")[1] : undefined;
    const queryPart = url.includes("?") ? url.split("?")[1] : undefined;
    const paramsStr = hashPart ?? queryPart;
    if (!paramsStr) return {};

    const params = new URLSearchParams(paramsStr);
    const error = params.get("error");
    if (error) return { error };

    const access_token = params.get("access_token") ?? undefined;
    const refresh_token = params.get("refresh_token") ?? undefined;
    return { access_token, refresh_token };
  } catch {
    return {};
  }
}

async function createSessionFromUrl(url: string): Promise<boolean> {
  const { access_token, refresh_token, error } = parseTokensFromUrl(url);
  if (error) throw new Error(error);
  if (!access_token) return false;

  const { error: setError } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? "",
  });
  if (setError) throw setError;
  return true;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function handleUrl(url: string | null) {
      if (!url || !url.includes("auth/callback")) {
        if (mounted) {
          setStatus("error");
          router.replace("/(auth)/login");
        }
        return;
      }

      try {
        const ok = await createSessionFromUrl(url);
        if (!mounted) return;
        if (ok) {
          setStatus("success");
          router.replace("/(tabs)");
        } else {
          setStatus("error");
          router.replace("/(auth)/login");
        }
      } catch (err) {
        console.error("[AuthCallback] setSession error:", err);
        if (mounted) {
          setStatus("error");
          router.replace("/(auth)/login");
        }
      }
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let subscription: { remove: () => void } | null = null;

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleUrl(initialUrl);
        return;
      }
      subscription = Linking.addEventListener("url", ({ url: u }) => handleUrl(u));
      timeoutId = setTimeout(() => {
        if (mounted) router.replace("/(auth)/login");
      }, 2000);
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 15 }}>
        {status === "loading" ? "Verifying your email…" : status === "success" ? "Success!" : "Redirecting…"}
      </Text>
    </View>
  );
}
