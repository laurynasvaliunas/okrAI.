import React, { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { radius, useTheme } from "../constants/theme";

type Props = {
  width?: number | `${number}%`;
  height: number;
  style?: ViewStyle;
  radiusPx?: number;
};

export default React.memo(function Skeleton({ width: w = "100%", height, style, radiusPx }: Props) {
  const { colors } = useTheme();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.45, 0.85]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: w,
          height,
          borderRadius: radiusPx ?? radius.sm,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
});

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
