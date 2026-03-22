import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { radius, anim, useTheme } from "../constants/theme";

interface ProgressBarProps {
  progress: number;
  height?: 4 | 8;
  color?: string;
  trackColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export default React.memo(function ProgressBar({
  progress,
  height = 4,
  color,
  trackColor,
  animated = false,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.accent;
  const track = trackColor ?? colors.border;
  const clamped = Math.min(100, Math.max(0, progress));
  const animWidth = useRef(new Animated.Value(animated ? 0 : clamped)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(animWidth, {
        toValue: clamped,
        ...anim.spring.default,
        useNativeDriver: false, // width is a layout prop — native driver doesn't support it
      }).start();
    } else {
      animWidth.setValue(clamped);
    }
  }, [clamped, animated, animWidth]);

  const r = height === 8 ? radius.sm / 2 : 2;

  return (
    <View style={[styles.track, { height, borderRadius: r, backgroundColor: track }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: r,
            backgroundColor: fillColor,
            width: animWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
              extrapolate: "clamp",
            }),
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
