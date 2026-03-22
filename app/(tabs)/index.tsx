import React, { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import {
  getObjectives,
  getProfileStats,
  calcObjectiveProgress,
  LIFE_AREA_MAP,
  type KeyResult,
} from "../../lib/queries";
import { space, radius, useTheme, typography } from "../../constants/theme";
import { refreshSessionWithTimeout } from "../../lib/sessionRefresh";
import { impactLight } from "../../lib/haptics";
import { Headline, Body, Title2, Caption, Title1 } from "../../components/Typography";
import Card from "../../components/Card";
import Button from "../../components/Button";
import ProgressRing from "../../components/ProgressRing";
import EmptyState from "../../components/EmptyState";
import CoachCard from "../../components/CoachCard";
import ObjectiveCard from "../../components/ObjectiveCard";
import Skeleton from "../../components/Skeleton";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isWithin7Days(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(now.getDate() + 7);
  return due >= now && due <= sevenDays;
}

function hasDueSoonKr(krs: KeyResult[]): boolean {
  return krs.some((kr) => isWithin7Days(kr.due_date));
}

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const userId = user?.id;
  const router = useRouter();
  const { colors, isDark, shadows: shadowTokens } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    isRefetching: refreshing,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["objectives", userId],
    queryFn: async () => {
      await refreshSessionWithTimeout(5000);
      return Promise.race([
        getObjectives(userId!),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Pull to retry.")), 8000)
        ),
      ]);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });

  const { data: stats } = useQuery({
    queryKey: ["profileStats", userId],
    queryFn: () => getProfileStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const objectives = (data ?? []).filter((o) => o.status === "active");
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const focusObjectives = objectives.filter((o) => hasDueSoonKr(o.key_results ?? []));
  const avgProgress =
    objectives.length > 0
      ? Math.round(
          objectives.reduce((s, o) => s + calcObjectiveProgress(o.key_results ?? []), 0) / objectives.length
        )
      : 0;

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const activePreview = objectives.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 88,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        {/* Header — matches Figma Make: surface bar + border */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top + space.lg,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Headline style={styles.greetingLine}>
                {greeting}, {firstName}
              </Headline>
              <Body color={colors.textSecondary} style={styles.dateLine}>
                {dateLabel}
              </Body>
            </View>
            <TouchableOpacity
              onPress={() => {
                impactLight();
                router.push("/check-in");
              }}
              style={[
                styles.checkInBtn,
                { backgroundColor: colors.accent },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open weekly check-in"
            >
              <Caption color={colors.accentForeground} style={styles.checkInBtnText}>
                Check-in
              </Caption>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: space.xl }]}>
          {isLoading ? (
            <View style={styles.sectionGap}>
              <Skeleton height={200} radiusPx={radius.lg} />
              <Skeleton height={120} radiusPx={radius.lg} />
            </View>
          ) : isError ? (
            <EmptyState
              message="Could not load objectives."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <>
              {/* Momentum card */}
              <Card elevation="md" style={[styles.momentumCard, shadowTokens.sm]}>
                <View style={styles.momentumTop}>
                  <View style={styles.momentumCopy}>
                    <Title2 style={styles.momentumTitle}>Your momentum</Title2>
                    <Body color={colors.textSecondary} style={styles.momentumSub}>
                      {objectives.length} active {objectives.length === 1 ? "goal" : "goals"}
                    </Body>
                  </View>
                  <ProgressRing progress={avgProgress} size={80} strokeWidth={6} label="avg" />
                </View>

                <View style={[styles.statsGrid, { borderTopColor: colors.borderSubtle }]}>
                  <View style={styles.statCell}>
                    <Caption color={colors.textTertiary} style={styles.statLabel}>
                      Total
                    </Caption>
                    <Title1 color={colors.textPrimary}>{stats?.totalObjectives ?? "—"}</Title1>
                  </View>
                  <View style={styles.statCell}>
                    <Caption color={colors.textTertiary} style={styles.statLabel}>
                      Done
                    </Caption>
                    <Title1 color={colors.success}>{stats?.completedObjectives ?? "—"}</Title1>
                  </View>
                  <View style={styles.statCell}>
                    <Caption color={colors.textTertiary} style={styles.statLabel}>
                      Check-ins
                    </Caption>
                    <Title1 color={colors.accent}>{stats?.totalCheckIns ?? "—"}</Title1>
                  </View>
                </View>
              </Card>

              <CoachCard
                icon="sparkles"
                title="okrAI. Coach"
                subtitle="Guidance & accountability"
                body="Get personalized guidance and stay accountable to your goals."
                onPress={() => router.push("/(tabs)/coach")}
              />

              {focusObjectives.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <Title2 style={styles.sectionTitle}>Today&apos;s focus</Title2>
                  <View style={styles.cardList}>
                    {focusObjectives.map((obj) => {
                      const area = LIFE_AREA_MAP[obj.life_area];
                      const krs = obj.key_results ?? [];
                      const soonKrs = krs.filter((kr) => isWithin7Days(kr.due_date));
                      const progress = calcObjectiveProgress(krs);
                      return (
                        <ObjectiveCard
                          key={obj.id}
                          data={{
                            id: obj.id,
                            title: obj.title,
                            areaLabel: area?.label ?? obj.life_area,
                            areaEmoji: area?.emoji,
                            cadence: obj.cadence,
                            progress,
                            krCount: krs.length,
                            meta: `${soonKrs.length} KR${soonKrs.length !== 1 ? "s" : ""} due soon`,
                          }}
                          onPress={() => router.push(`/objectives/${obj.id}`)}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {objectives.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionRow}>
                    <Title2 style={styles.sectionTitleFlat}>Active goals</Title2>
                    <TouchableOpacity
                      onPress={() => {
                        impactLight();
                        router.push("/(tabs)/objectives");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="View all objectives"
                    >
                      <Caption color={colors.accent} style={styles.viewAll}>
                        View all
                      </Caption>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardList}>
                    {activePreview.map((obj) => {
                      const area = LIFE_AREA_MAP[obj.life_area];
                      const krs = obj.key_results ?? [];
                      const progress = calcObjectiveProgress(krs);
                      return (
                        <ObjectiveCard
                          key={obj.id}
                          data={{
                            id: obj.id,
                            title: obj.title,
                            areaLabel: area?.label ?? obj.life_area,
                            areaEmoji: area?.emoji,
                            cadence: obj.cadence,
                            progress,
                            krCount: krs.length,
                          }}
                          onPress={() => router.push(`/objectives/${obj.id}`)}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyEmoji} accessibilityLabel="">
                    🎯
                  </Text>
                  <Title2 style={styles.emptyTitle}>Begin with intention</Title2>
                  <Body color={colors.textSecondary} style={styles.emptyBody}>
                    Set your first goal and start building momentum toward what matters most.
                  </Body>
                  <Button
                    title="Create your first goal"
                    variant="primary"
                    size="lg"
                    onPress={() => router.push("/objectives/new")}
                    style={styles.emptyCta}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: space.lg,
    paddingHorizontal: space.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    maxWidth: 520,
    alignSelf: "center",
    width: "100%",
  },
  headerText: {
    flex: 1,
    marginRight: space.md,
  },
  greetingLine: {
    marginBottom: space.xs,
  },
  dateLine: {
    ...typography.body,
  },
  checkInBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  checkInBtnText: {
    fontWeight: "600",
  },
  body: {
    paddingTop: space.xxl,
    maxWidth: 520,
    alignSelf: "center",
    width: "100%",
  },
  sectionGap: {
    gap: space.md,
  },
  momentumCard: {
    padding: space.xl,
    marginBottom: space.xxl,
  },
  momentumTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: space.lg,
  },
  momentumCopy: {
    flex: 1,
    marginRight: space.md,
  },
  momentumTitle: {
    marginBottom: space.xs,
  },
  momentumSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.lg,
    gap: space.md,
  },
  statCell: {
    flex: 1,
  },
  statLabel: {
    marginBottom: space.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    fontWeight: "600",
  },
  sectionBlock: {
    marginBottom: space.xxl,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  sectionTitleFlat: {
    marginBottom: 0,
  },
  viewAll: {
    fontWeight: "500",
    fontSize: 14,
  },
  cardList: {
    gap: space.md,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: space.xxxl,
    paddingHorizontal: space.md,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: space.lg,
  },
  emptyTitle: {
    marginBottom: space.sm,
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: space.xxl,
  },
  emptyCta: {
    minWidth: 260,
  },
});
