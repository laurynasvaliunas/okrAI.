import { View, StyleSheet, ScrollView, Switch, StatusBar, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { space, radius, useTheme, type ThemePreference } from "../../constants/theme";
import { Title2, Body, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import { impactLight } from "../../lib/haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, preference, setPreference } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [toneBalanced, setToneBalanced] = useState(true);

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
                setNotifications(v);
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
                setToneBalanced(v);
              }}
              trackColor={{ false: colors.border, true: colors.accentMuted }}
              thumbColor={toneBalanced ? colors.accent : colors.placeholder}
            />
          </View>
          <Caption color={colors.textTertiary} style={styles.hint}>
            When off, coach responses skew more direct. (Stored locally for now.)
          </Caption>
        </Card>

        <Card elevation="sm" style={styles.card}>
          <RowLabel title="Data & privacy" subtitle="Your objectives stay private to this account" />
          <Body color={colors.textSecondary} style={styles.privacy}>
            We minimize retention of coaching transcripts and never sell your data. Export and account deletion can
            plug into Supabase policies in production.
          </Body>
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
});
