import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { space, radius, useTheme } from "../constants/theme";
import { BodyMedium, Caption, Small } from "./Typography";
import Card from "./Card";
import ProgressBar from "./ProgressBar";
import Chip from "./Chip";
import { impactLight } from "../lib/haptics";

export type ObjectiveCardData = {
  id: string;
  title: string;
  areaLabel: string;
  areaEmoji?: string;
  cadence?: string;
  progress: number;
  krCount?: number;
  meta?: string;
};

type Props = {
  data: ObjectiveCardData;
  onPress: () => void;
};

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export default React.memo(function ObjectiveCard({ data, onPress }: Props) {
  const { colors } = useTheme();
  const cadenceLabel = data.cadence ? (CADENCE_LABELS[data.cadence] ?? data.cadence) : null;

  return (
    <TouchableOpacity
      onPress={() => {
        impactLight();
        onPress();
      }}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${data.title}, ${data.progress} percent complete`}
    >
      <Card elevation="md" style={styles.card}>
        {/* Area chip + cadence badge row */}
        <View style={styles.chipsRow}>
          <Chip emoji={data.areaEmoji ?? "◆"} label={data.areaLabel} variant="area" />
          {cadenceLabel ? (
            <View style={[styles.cadenceBadge, { backgroundColor: colors.overlay, borderColor: colors.border }]}>
              <Small style={{ color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {cadenceLabel}
              </Small>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <BodyMedium numberOfLines={2} style={styles.title}>
          {data.title}
        </BodyMedium>

        {/* Progress bar */}
        <ProgressBar progress={data.progress} animated style={styles.bar} height={4} />

        {/* Footer: KR count + % */}
        <View style={styles.footer}>
          <Caption color={colors.textTertiary}>
            {data.krCount != null
              ? `${data.krCount} key result${data.krCount !== 1 ? "s" : ""}`
              : data.meta ?? ""}
          </Caption>
          <Caption color={colors.accent} style={styles.pct}>
            {data.progress}%
          </Caption>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.sm,
  },
  cadenceBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    marginBottom: space.md,
  },
  bar: {
    marginBottom: space.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.xxs,
  },
  pct: {
    fontWeight: "700",
  },
});
