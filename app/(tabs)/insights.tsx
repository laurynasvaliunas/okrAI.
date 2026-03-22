import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import {
  getObjectives,
  getRecentCheckIns,
  getProfileStats,
  calcObjectiveProgress,
  LIFE_AREA_MAP,
} from "../../lib/queries";
import { space, radius, useTheme } from "../../constants/theme";
import {
  Display,
  Title2,
  Body,
  BodyMedium,
  Caption,
  Numeric,
} from "../../components/Typography";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import ProgressRing from "../../components/ProgressRing";
import Skeleton from "../../components/Skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseConfidence(inputText: string): number {
  const match = inputText.match(/confidence:(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

function sentimentEmoji(confidence: number): string {
  if (confidence >= 80) return "😊";
  if (confidence >= 60) return "🙂";
  if (confidence >= 40) return "😐";
  return "😕";
}

function formatCheckInDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const { colors, isDark, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: objectivesData, isLoading: loadingObjectives } = useQuery({
    queryKey: ["objectives", userId],
    queryFn: () => getObjectives(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ["recentCheckIns", userId],
    queryFn: () => getRecentCheckIns(userId!, 5),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: stats } = useQuery({
    queryKey: ["profileStats", userId],
    queryFn: () => getProfileStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingObjectives || loadingCheckIns;

  const objectives = objectivesData ?? [];
  const active = objectives.filter((o) => o.status === "active");
  const completed = objectives.filter((o) => o.status === "completed");

  const avgProgress = useMemo(() => {
    if (active.length === 0) return 0;
    return Math.round(
      active.reduce((s, o) => s + calcObjectiveProgress(o.key_results ?? []), 0) / active.length
    );
  }, [active]);

  // Group active objectives by life area
  const lifeAreaData = useMemo(() => {
    const map: Record<string, { count: number; totalProgress: number }> = {};
    for (const obj of active) {
      const area = obj.life_area;
      if (!map[area]) map[area] = { count: 0, totalProgress: 0 };
      map[area].count += 1;
      map[area].totalProgress += calcObjectiveProgress(obj.key_results ?? []);
    }
    return Object.entries(map).map(([id, { count, totalProgress }]) => ({
      id,
      label: LIFE_AREA_MAP[id]?.label ?? id,
      emoji: LIFE_AREA_MAP[id]?.emoji ?? "⭐",
      goalCount: count,
      progress: Math.round(totalProgress / count),
    }));
  }, [active]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + space.xl, backgroundColor: colors.bg }]}>
        <Display style={styles.headline}>Insights</Display>
        <Body color={colors.textSecondary} style={styles.sub}>
          Your progress at a glance
        </Body>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={180} radiusPx={radius.lg} />
            <Skeleton height={200} radiusPx={radius.lg} style={{ marginTop: space.md }} />
            <Skeleton height={160} radiusPx={radius.lg} style={{ marginTop: space.md }} />
          </View>
        ) : (
          <>
            {/* ── Overall Progress ─────────────────────────────── */}
            <Card elevation="md" style={styles.card}>
              <View style={styles.overallRow}>
                <View style={styles.overallLeft}>
                  <BodyMedium style={styles.cardTitle}>Overall Progress</BodyMedium>
                  <Caption color={colors.textSecondary}>Across all goals</Caption>
                </View>
                <ProgressRing
                  progress={avgProgress}
                  size={90}
                  strokeWidth={8}
                  label=""
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Caption color={colors.textTertiary} style={styles.statLabel}>ACTIVE</Caption>
                  <Numeric>{active.length}</Numeric>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Caption color={colors.textTertiary} style={styles.statLabel}>COMPLETE</Caption>
                  <Numeric color={colors.success}>{completed.length}</Numeric>
                </View>
              </View>
            </Card>

            {/* ── Progress by Life Area ──────────────────────── */}
            {lifeAreaData.length > 0 && (
              <Card elevation="md" style={styles.card}>
                <BodyMedium style={[styles.cardTitle, { marginBottom: space.lg }]}>
                  Progress by Life Area
                </BodyMedium>
                {lifeAreaData.map((area, i) => (
                  <View key={area.id} style={i < lifeAreaData.length - 1 ? styles.areaItem : undefined}>
                    <View style={styles.areaRow}>
                      <View style={styles.areaLeft}>
                        <Body style={styles.areaEmoji}>{area.emoji}</Body>
                        <BodyMedium>{area.label}</BodyMedium>
                        <Caption color={colors.textTertiary}>
                          {" "}({area.goalCount} goal{area.goalCount !== 1 ? "s" : ""})
                        </Caption>
                      </View>
                      <BodyMedium color={colors.accent}>{area.progress}%</BodyMedium>
                    </View>
                    <ProgressBar
                      progress={area.progress}
                      animated
                      height={4}
                      style={styles.areaBar}
                    />
                  </View>
                ))}
              </Card>
            )}

            {/* ── Recent Check-ins ───────────────────────────── */}
            <Card elevation="md" style={styles.card}>
              <View style={styles.checkInHeader}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                <BodyMedium style={[styles.cardTitle, { marginLeft: space.sm }]}>
                  Recent Check-ins
                </BodyMedium>
              </View>

              {checkIns.length === 0 ? (
                <Body color={colors.textSecondary}>
                  No check-ins yet. Start your first weekly check-in from the Home tab.
                </Body>
              ) : (
                checkIns.map((ci, i) => {
                  const confidence = parseConfidence(ci.input_text);
                  const goalsReviewed =
                    (ci.coaching_response as { goals_reviewed?: number })?.goals_reviewed ?? 0;
                  const excerpt = ci.coaching_response?.message?.trim();
                  return (
                    <View key={ci.id}>
                      {i > 0 && (
                        <View style={[styles.checkInDivider, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.checkInRow}>
                        <View style={styles.checkInMeta}>
                          <Body style={styles.sentimentEmoji}>{sentimentEmoji(confidence)}</Body>
                          <BodyMedium>{formatCheckInDate(ci.created_at)}</BodyMedium>
                        </View>
                        {goalsReviewed > 0 && (
                          <Caption color={colors.textTertiary}>
                            {goalsReviewed} goal{goalsReviewed !== 1 ? "s" : ""} reviewed
                          </Caption>
                        )}
                      </View>
                      {!!excerpt && (
                        <Body
                          color={colors.textSecondary}
                          numberOfLines={2}
                          style={styles.checkInExcerpt}
                        >
                          {excerpt}
                        </Body>
                      )}
                    </View>
                  );
                })
              )}
            </Card>

            {/* ── Summary stats ──────────────────────────────── */}
            <View style={styles.summaryRow}>
              <Card elevation="sm" style={[styles.summaryCard, shadows.sm]}>
                <Caption color={colors.textTertiary} style={styles.summaryLabel}>
                  TOTAL GOALS
                </Caption>
                <Numeric style={styles.summaryValue}>
                  {stats?.totalObjectives ?? objectives.length}
                </Numeric>
              </Card>
              <Card elevation="sm" style={[styles.summaryCard, shadows.sm]}>
                <Caption color={colors.textTertiary} style={styles.summaryLabel}>
                  CHECK-INS
                </Caption>
                <Numeric color={colors.accent} style={styles.summaryValue}>
                  {stats?.totalCheckIns ?? checkIns.length}
                </Numeric>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  headline: {
    marginBottom: space.xs,
  },
  sub: {
    marginTop: space.xs,
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
  },
  skeletonBlock: {
    marginTop: space.sm,
  },
  card: {
    marginBottom: space.md,
  },

  // Overall Progress
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.lg,
  },
  overallLeft: {
    flex: 1,
    marginRight: space.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: space.lg,
  },
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
    marginHorizontal: space.xl,
  },
  statLabel: {
    letterSpacing: 1,
    marginBottom: space.xs,
  },

  // Life area
  areaItem: {
    marginBottom: space.md,
  },
  areaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  areaEmoji: {
    marginRight: space.sm,
    fontSize: 18,
  },
  areaBar: {
    marginTop: space.xs,
  },

  // Check-ins
  checkInHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.lg,
  },
  checkInDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space.md,
  },
  checkInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkInMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sentimentEmoji: {
    fontSize: 18,
  },
  checkInExcerpt: {
    marginTop: space.xs,
    lineHeight: 20,
  },

  // Summary stats
  summaryRow: {
    flexDirection: "row",
    gap: space.md,
    marginBottom: space.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    letterSpacing: 1,
    marginBottom: space.sm,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
  },
});
