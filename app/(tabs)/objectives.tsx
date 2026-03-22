import React, { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { impactMedium } from "../../lib/haptics";
import { useAuthStore } from "../../stores/authStore";
import {
  getObjectives,
  LIFE_AREA_MAP,
  type Objective,
} from "../../lib/queries";
import { refreshSessionWithTimeout } from "../../lib/sessionRefresh";
import { space, radius, anim, useTheme } from "../../constants/theme";
import { Display, Title3, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import ProgressBar from "../../components/ProgressBar";
import EmptyState from "../../components/EmptyState";

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

// ─── Objective Card ─────────────────────────────────────────────────────────

const ObjectiveCard = React.memo(function ObjectiveCard({ objective, onPress }: { objective: Objective; onPress: () => void }) {
  const { colors } = useTheme();
  const area = LIFE_AREA_MAP[objective.life_area];
  const krCount = objective.key_results?.length ?? 0;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.98, ...anim.spring.stiff }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, ...anim.spring.default }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <Card elevation="sm" style={styles.card}>
          <View style={styles.cardTop}>
            <Chip emoji={area?.emoji ?? "⭐"} label={area?.label ?? objective.life_area} variant="area" />
            <Chip label={CADENCE_LABELS[objective.cadence] ?? objective.cadence} variant="badge" />
          </View>

          <Title3 numberOfLines={2} style={styles.cardTitle}>{objective.title}</Title3>

          <ProgressBar progress={objective.progress ?? 0} animated style={styles.progressBarSpacing} />

          <View style={styles.cardFooter}>
            <Caption color={colors.textTertiary}>{krCount} key result{krCount !== 1 ? "s" : ""}</Caption>
            <Caption color={colors.accent} style={styles.progressLabel}>{Math.round(objective.progress ?? 0)}%</Caption>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ObjectivesScreen() {
  const { user, profile } = useAuthStore();
  const userId = user?.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, shadows } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>("all");

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
    retry: 1,
  });

  const objectives = data ?? [];
  const preferredAreas = profile?.preferred_life_areas ?? [];

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const filtered =
    activeFilter === "all"
      ? objectives
      : objectives.filter((o) => o.life_area === activeFilter);

  const filterTabs = ["all", ...preferredAreas];

  const handleFabPress = useCallback(() => {
    impactMedium();
    router.push("/objectives/new");
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.xl }]}>
        <Display>Goals</Display>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.surface }, shadows.sm]}
          onPress={() => router.push("/objectives/new")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Divider between header and filter row */}
      <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
        nestedScrollEnabled
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          const area = LIFE_AREA_MAP[tab];
          const label = tab === "all" ? "All" : (area?.label ?? tab);
          const emoji = tab === "all" ? undefined : area?.emoji;
          return (
            <Chip
              key={tab}
              label={label}
              emoji={emoji}
              selected={isActive}
              onPress={() => setActiveFilter(tab)}
              variant="filter"
            />
          );
        })}
        <TouchableOpacity
          style={[
            styles.addAreaChip,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push("/profile/edit-life-areas")}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* List */}
      <FlatList
        data={isLoading || isError ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ObjectiveCard
            objective={item}
            onPress={() => router.push(`/objectives/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <EmptyState message="Loading..." />
          ) : isError ? (
            <EmptyState message="Could not load objectives." actionLabel="Retry" onAction={() => refetch()} />
          ) : (
            <EmptyState
              message={
                activeFilter === "all"
                  ? "No goals yet. Tap + to create your first one."
                  : `No goals in ${LIFE_AREA_MAP[activeFilter]?.label ?? activeFilter} yet.`
              }
            />
          )
        }
        style={{ flex: 1 }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }, shadows.lg]}
        onPress={handleFabPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.accentForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filter chips
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    gap: space.sm,
  },

  // List
  list: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 120, // clear FAB + tab bar
    gap: space.md,
  },

  // Header divider
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: space.xl,
  },

  // Card
  card: {
    padding: space.lg,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  cardTitle: {
    marginBottom: space.md,
  },
  progressBarSpacing: {
    marginBottom: space.sm,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontWeight: "700",
  },

  // Add area chip
  addAreaChip: {
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: space.xxxl,
    right: space.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
