import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from "react-native";
import { radius, space, typography, useTheme } from "../constants/theme";

type Variant = "filter" | "area" | "badge";

interface ChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
}

export default React.memo(function Chip({
  label,
  emoji,
  selected = false,
  onPress,
  variant = "filter",
  style,
}: ChipProps) {
  const { colors } = useTheme();
  const isFilter = variant === "filter";
  const isBadge = variant === "badge";
  const isArea = variant === "area";

  const containerStyle = useMemo(
    () => [
      styles.base,
      isFilter && [
        styles.filter,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
        },
      ],
      isBadge && [styles.badge, { backgroundColor: colors.surfaceElevated }],
      isArea && [
        styles.area,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
        },
      ],
      style,
    ],
    [colors, isFilter, isBadge, isArea, selected, style]
  );

  const textStyle = useMemo(
    () => [
      styles.text,
      { color: selected ? colors.accent : colors.textSecondary },
      isBadge && styles.badgeText,
    ],
    [colors, selected, isBadge]
  );

  const content = isArea ? (
    <>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[textStyle, styles.areaText]}>{label}</Text>
    </>
  ) : (
    <>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={textStyle}>{isBadge ? label.toUpperCase() : label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={containerStyle}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
});

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  filter: {
    height: 36,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  area: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 2,
    minHeight: 56,
  },
  areaText: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.sm,
  },
  text: {
    ...typography.caption,
  },
  badgeText: {
    ...typography.small,
    letterSpacing: 0.5,
  },
  emoji: {
    fontSize: 14,
  },
});
