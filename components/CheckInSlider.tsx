import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { space, radius, useTheme } from "../constants/theme";
import { BodyMedium, Caption } from "./Typography";
import { impactLight } from "../lib/haptics";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
  accessibilityHint?: string;
};

export default React.memo(function CheckInSlider({
  label,
  value,
  onChange,
  lowLabel = "Low",
  highLabel = "High",
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();

  const handleChange = useCallback(
    (v: number) => {
      onChange(Math.round(v));
    },
    [onChange]
  );

  const onSlidingComplete = useCallback(() => {
    impactLight();
  }, []);

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value, text: `${value} percent` }}
      accessibilityHint={accessibilityHint}
    >
      <BodyMedium style={styles.label}>{label}</BodyMedium>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={handleChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
      <View style={styles.row}>
        <Caption color={colors.textTertiary}>{lowLabel}</Caption>
        <Caption color={colors.accent} style={styles.value}>
          {value}%
        </Caption>
        <Caption color={colors.textTertiary}>{highLabel}</Caption>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    marginBottom: space.md,
  },
  label: {
    marginBottom: space.sm,
  },
  slider: {
    width: "100%",
    height: 44,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.xs,
  },
  value: {
    fontWeight: "700",
    fontSize: 14,
  },
});
