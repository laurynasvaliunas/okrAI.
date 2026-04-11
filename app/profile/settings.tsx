import { View, StyleSheet, ScrollView, Switch, StatusBar, TouchableOpacity, Alert, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { space, radius, useTheme, type ThemePreference } from "../../constants/theme";
import { Title2, Body, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import { impactLight } from "../../lib/haptics";
import { useAuthStore } from "../../stores/authStore";
import { useIsPro } from "../../hooks/useSubscription";
import { supabase } from "../../lib/supabase";
import { logOutPurchases } from "../../lib/purchases";

const STORAGE_KEYS = {
  notifications: "@okrai/setting_notifications",
  toneBalanced: "@okrai/setting_tone_balanced",
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, preference, setPreference } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [toneBalanced, setToneBalanced] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { signOut: storeSignOut } = useAuthStore();
  const isPro = useIsPro();

  // Load persisted settings
  useEffect(() => {
    (async () => {
      const [savedNotif, savedTone] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.notifications),
        AsyncStorage.getItem(STORAGE_KEYS.toneBalanced),
      ]);
      if (savedNotif !== null) setNotifications(savedNotif === "true");
      if (savedTone !== null) setToneBalanced(savedTone === "true");
    })();
  }, []);

  const persistNotifications = useCallback((v: boolean) => {
    setNotifications(v);
    void AsyncStorage.setItem(STORAGE_KEYS.notifications, String(v));
  }, []);

  const persistTone = useCallback((v: boolean) => {
    setToneBalanced(v);
    void AsyncStorage.setItem(STORAGE_KEYS.toneBalanced, String(v));
  }, []);

  function cycleTheme() {
    impactLight();
    const order: ThemePreference[] = ["system", "light", "dark"];
    const i = order.indexOf(preference);
    const next = order[(i + 1) % order.length];
    void setPreference(next);
  }

  const themeLabel =
    preference === "system" ? "System" : preference === "light" ? "Light" : "Dark";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.huge,
          paddingHorizontal: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Body style={{ color: colors.accent, fontWeight: "600" }}>Back</Body>
        </TouchableOpacity>

        <Title2 style={styles.title}>Settings</Title2>
        <Caption color={colors.textTertiary} style={styles.sub}>
          Appearance, coaching tone, and privacy — kept on one calm screen.
        </Caption>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Appearance" subtitle="Matches iOS/Android when set to System" />
          <TouchableOpacity style={styles.rowBtn} onPress={cycleTheme} accessibilityRole="button">
            <Body>Theme</Body>
            <Caption color={colors.accent}>{themeLabel}</Caption>
          </TouchableOpacity>
        </Card>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Notifications" subtitle="Gentle nudges — never guilt copy" />
          <View style={styles.switchRow}>
            <Body>Weekly check-in reminder</Body>
            <Switch
              value={notifications}
              onValueChange={(v) => {
                impactLight();
                persistNotifications(v);
              }}
              trackColor={{ false: colors.border, true: colors.accentMuted }}
              thumbColor={notifications ? colors.accent : colors.placeholder}
            />
          </View>
        </Card>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Coaching tone" subtitle="Supportive vs. direct" />
          <View style={styles.switchRow}>
            <Body>Balanced (recommended)</Body>
            <Switch
              value={toneBalanced}
              onValueChange={(v) => {
                impactLight();
                persistTone(v);
              }}
              trackColor={{ false: colors.border, true: colors.accentMuted }}
              thumbColor={toneBalanced ? colors.accent : colors.placeholder}
            />
          </View>
          <Caption color={colors.textTertiary} style={styles.hint}>
            When off, coach responses skew more direct.
          </Caption>
        </Card>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Subscription" subtitle="Manage your plan" />
          {isPro ? (
            <>
              <TouchableOpacity
                style={styles.rowBtn}
                onPress={() => {
                  const url = Platform.select({
                    ios: "https://apps.apple.com/account/subscriptions",
                    android: "https://play.google.com/store/account/subscriptions",
                    default: "",
                  });
                  if (url) Linking.openURL(url);
                }}
                accessibilityRole="button"
              >
                <Body>Manage subscription</Body>
                <Ionicons name="open-outline" size={16} color={colors.accent} />
              </TouchableOpacity>
              <Caption color={colors.textTertiary} style={styles.hint}>
                Opens your {Platform.OS === "ios" ? "App Store" : "Google Play"} subscription settings.
              </Caption>
            </>
          ) : (
            <TouchableOpacity
              style={styles.rowBtn}
              onPress={() => router.push("/profile/upgrade")}
              accessibilityRole="button"
            >
              <Body>Upgrade to Pro</Body>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )}
        </Card>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Data & privacy" subtitle="Your objectives stay private to this account" />
          <Body color={colors.textSecondary} style={styles.privacy}>
            We never sell your data. Your goals and coaching history are stored securely and only accessible to you.
          </Body>
        </Card>

        <Card elevation="sm" style={[styles.card, { borderColor: colors.error, borderWidth: StyleSheet.hairlineWidth }]}>
          <RowLabel title="Danger zone" subtitle="Permanent actions" />
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: colors.error }]}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "This will permanently delete your account, all goals, key results, check-ins, and coaching history. This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Forever",
                    style: "destructive",
                    onPress: async () => {
                      setDeleting(true);
                      try {
                        // Delete user data from profiles (cascades to objectives, key results, etc.)
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase.from("coaching_sessions").delete().eq("user_id", user.id);
                          await supabase.from("profiles").delete().eq("id", user.id);
                        }
                        await logOutPurchases();
                        await supabase.auth.signOut();
                        storeSignOut();
                        router.replace("/(auth)/login");
                      } catch (err) {
                        console.error("[Settings] delete account error:", err);
                        Alert.alert("Error", "Could not delete your account. Please try again or contact support at privacy@okrai.io.");
                      } finally {
                        setDeleting(false);
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Body color={colors.error}>{deleting ? "Deleting…" : "Delete My Account"}</Body>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

function RowLabel({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: space.md }}>
      <Body style={{ fontWeight: "700" }}>{title}</Body>
      <Caption color={colors.textTertiary}>{subtitle}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    marginBottom: space.xl,
  },
  title: {
    marginBottom: space.xs,
  },
  sub: {
    marginBottom: space.xxl,
    lineHeight: 20,
  },
  card: {
    marginBottom: space.md,
    borderRadius: radius.lg,
  },
  rowBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.xs,
  },
  hint: {
    marginTop: space.md,
    lineHeight: 18,
  },
  privacy: {
    lineHeight: 22,
    marginTop: space.xs,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.xs,
  },
});
