import { useQuery } from "@tanstack/react-query";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { getProfileStats, LIFE_AREA_MAP } from "../../lib/queries";
import { signOut as authSignOut } from "../../lib/auth";
import { space, radius, useTheme } from "../../constants/theme";
import { Display, BodyMedium, Body, Caption, Numeric } from "../../components/Typography";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import Chip from "../../components/Chip";

// ─── Nav row ──────────────────────────────────────────────────────────────────

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.navRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.navIcon} />
      <BodyMedium style={styles.navLabel}>{label}</BodyMedium>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, profile, signOut: storeSignOut } = useAuthStore();
  const { colors, isDark } = useTheme();
  const userId = user?.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: stats, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["profileStats", userId],
    queryFn: () => getProfileStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try { await authSignOut(); } catch { /* continue even if network call fails */ }
          storeSignOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const lifeAreas = profile?.preferred_life_areas ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + 49 + space.massive },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Page title */}
      <Display style={styles.pageTitle}>Profile</Display>

      {/* ── Identity + Stats card ──────────────────────────── */}
      <Card elevation="md" style={styles.identityCard}>
        {/* Avatar + name row */}
        <View style={styles.identityRow}>
          <Avatar name={profile?.full_name ?? "?"} size="lg" />
          <View style={styles.identityText}>
            <BodyMedium style={styles.fullName}>{profile?.full_name ?? "—"}</BodyMedium>
            <Caption color={colors.textSecondary}>
              {profile?.email ?? user?.email ?? "—"}
            </Caption>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        {/* Stats row */}
        {statsError ? (
          <TouchableOpacity onPress={() => refetchStats()} activeOpacity={0.7}>
            <Body color={colors.accent}>Could not load stats. Tap to retry.</Body>
          </TouchableOpacity>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Caption color={colors.textTertiary} style={styles.statLabel}>TOTAL GOALS</Caption>
              <Numeric style={styles.statValue}>{stats?.totalObjectives ?? "—"}</Numeric>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Caption color={colors.textTertiary} style={styles.statLabel}>COMPLETED</Caption>
              <Numeric color={colors.success} style={styles.statValue}>
                {stats?.completedObjectives ?? "—"}
              </Numeric>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Caption color={colors.textTertiary} style={styles.statLabel}>CHECK-INS</Caption>
              <Numeric color={colors.accent} style={styles.statValue}>
                {stats?.totalCheckIns ?? "—"}
              </Numeric>
            </View>
          </View>
        )}
      </Card>

      {/* ── Preferred Life Areas ──────────────────────────── */}
      <Card elevation="sm" style={styles.card}>
        <View style={styles.lifeAreaHeader}>
          <BodyMedium style={styles.cardSectionTitle}>Preferred Life Areas</BodyMedium>
          <TouchableOpacity onPress={() => router.push("/profile/edit-life-areas")} activeOpacity={0.7}>
            <Body color={colors.accent}>Edit</Body>
          </TouchableOpacity>
        </View>
        {lifeAreas.length === 0 ? (
          <Body color={colors.textSecondary}>No life areas selected yet.</Body>
        ) : (
          <View style={styles.chipsWrap}>
            {lifeAreas.map((areaId) => {
              const area = LIFE_AREA_MAP[areaId];
              return (
                <Chip
                  key={areaId}
                  variant="area"
                  emoji={area?.emoji ?? "⭐"}
                  label={area?.label ?? areaId}
                />
              );
            })}
          </View>
        )}
      </Card>

      {/* ── Navigation rows ───────────────────────────────── */}
      <View style={styles.navSection}>
        <NavRow
          icon="sparkles-outline"
          label="Component Showcase"
          onPress={() => router.push("/profile/showcase" as never)}
        />
        <NavRow
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push("/profile/settings")}
        />
      </View>

      {/* ── Sign Out ──────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.error }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.signOutIcon} />
        <BodyMedium color={colors.error}>Sign Out</BodyMedium>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: space.xl,
  },

  pageTitle: {
    marginBottom: space.xl,
  },

  // Identity card
  identityCard: {
    marginBottom: space.md,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    marginBottom: space.lg,
  },
  identityText: {
    flex: 1,
  },
  fullName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: space.xxs,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: space.lg,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    marginHorizontal: space.md,
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: space.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },

  // Life areas
  card: {
    marginBottom: space.md,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  lifeAreaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },

  // Nav rows
  navSection: {
    gap: space.sm,
    marginBottom: space.md,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.md + 2,
  },
  navIcon: {
    marginRight: space.md,
  },
  navLabel: {
    flex: 1,
  },

  // Sign out
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: space.md + 2,
    marginTop: space.sm,
    gap: space.sm,
  },
  signOutIcon: {
    marginRight: space.xs,
  },
});
