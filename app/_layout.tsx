import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import type { Profile } from "../stores/authStore";
import { initializePurchases, logInPurchases, logOutPurchases } from "../lib/purchases";
import { ThemeProvider, useTheme } from "../constants/theme";

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

  console.log("[Layout] appReady:", appReady, "userId:", session?.user?.id);

  useEffect(() => {
    initializePurchases();

    Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null }; error: null }>((resolve) =>
        setTimeout(() => {
          console.warn("[Layout] getSession timed out — proceeding without session");
          resolve({ data: { session: null }, error: null });
        }, 8000)
      ),
    ])
      .then(({ data: { session: initialSession }, error }) => {
        if (error) console.error("[Layout] getSession error:", error);
        if (initialSession) {
          setSession(initialSession);
          void logInPurchases(initialSession.user.id);
          void Promise.race([
            ensureProfile(
              initialSession.user.id,
              initialSession.user.email,
              initialSession.user.user_metadata ?? {}
            ),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
          ]).then((profileData) => {
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
      console.log("[Layout] auth event:", event);
      setSession(newSession);

      if (event === "SIGNED_OUT") {
        void logOutPurchases();
        signOut();
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        try {
          await logInPurchases(newSession.user.id);
          const profileData = await Promise.race([
            ensureProfile(
              newSession.user.id,
              newSession.user.email,
              newSession.user.user_metadata ?? {}
            ),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
          ]);
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
            retry: 0,
          },
        },
      }),
    []
  );

  if (!appReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
