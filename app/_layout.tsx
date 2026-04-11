import { useEffect, useMemo, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Profile } from "../stores/authStore";
import { initializePurchases, logInPurchases, logOutPurchases } from "../lib/purchases";
import { ThemeProvider, useTheme } from "../constants/theme";
import SplashAnimation from "../components/SplashAnimation";
import ErrorBoundary from "../components/ErrorBoundary";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

/** Promise.race with a timeout that cleans up after itself. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

async function ensureProfile(userId: string, userEmail: string | undefined, userMetadata: Record<string, unknown>) {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("[Layout] profile fetch error:", fetchError);
    return null;
  }

  if (!existing) {
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail ?? null,
        full_name: (userMetadata?.full_name as string) ?? null,
        account_type: "personal",
        onboarding_completed: false,
      },
      { onConflict: "id" }
    );
    if (upsertError) {
      console.error("[Layout] profile upsert error:", upsertError);
      return null;
    }
  }

  const { data: profileData, error: refetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (refetchError) {
    console.error("[Layout] profile refetch error:", refetchError);
    return null;
  }

  return profileData as Profile;
}

function RootLayoutNav() {
  const { session, profile, setSession, setProfile, setLoading, signOut } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  if (__DEV__) console.log("[Layout] appReady:", appReady, "userId:", session?.user?.id);

  useEffect(() => {
    initializePurchases();

    withTimeout(
      supabase.auth.getSession(),
      8000,
      { data: { session: null }, error: null } as Awaited<ReturnType<typeof supabase.auth.getSession>>
    )
      .then(({ data: { session: initialSession }, error }) => {
        if (error) {
          console.error("[Layout] getSession error:", error);
          // Stale/invalid refresh token — clear it so the user is sent to login
          void supabase.auth.signOut();
        }
        if (initialSession) {
          setSession(initialSession);
          void logInPurchases(initialSession.user.id);
          void withTimeout(
            ensureProfile(
              initialSession.user.id,
              initialSession.user.email,
              initialSession.user.user_metadata ?? {}
            ),
            8000,
            null
          ).then((profileData) => {
            if (profileData) setProfile(profileData);
          });
        }
        setAppReady(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Layout] getSession failed:", err);
        setAppReady(true);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (__DEV__) console.log("[Layout] auth event:", event);
      setSession(newSession);

      if (event === "SIGNED_OUT") {
        void logOutPurchases();
        signOut();
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && !newSession) {
        void logOutPurchases();
        signOut();
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        try {
          await logInPurchases(newSession.user.id);
          const profileData = await withTimeout(
            ensureProfile(
              newSession.user.id,
              newSession.user.email,
              newSession.user.user_metadata ?? {}
            ),
            8000,
            null
          );
          if (profileData) setProfile(profileData);
        } catch (err) {
          console.error("[Layout] profile load error:", err);
        }
      }

      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inAuthCallback = segments[0] === "auth" && segments.at(1) === "callback";

    if (!session) {
      if (!inAuth && !inAuthCallback) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (profile && !profile.onboarding_completed) {
      if (!inOnboarding) {
        router.replace("/(onboarding)/welcome");
      }
      return;
    }

    if (session && profile?.onboarding_completed) {
      if (inAuth || inOnboarding) {
        router.replace("/(tabs)");
      }
    }
  }, [appReady, session, profile, segments]);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      {(!appReady || !splashDone) && (
        <SplashAnimation onDone={() => setSplashDone(true)} />
      )}
      {appReady && <Slot />}
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
