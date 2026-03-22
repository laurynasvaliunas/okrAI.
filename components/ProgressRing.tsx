import React, { useEffect, useRef, useMemo } from "react";
import { View, Animated, StyleSheet, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { anim, useTheme } from "../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

export default React.memo(function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 10,
  color,
  trackColor,
  label = "avg",
}: ProgressRingProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.accent;
  const track = trackColor ?? colors.border;
  const clamped = Math.min(100, Math.max(0, progress));
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: clamped,
      ...anim.spring.default,
      useNativeDriver: false, // SVG strokeDashoffset is not supported by native driver
    }).start();
  }, [clamped, animValue]);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const dashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  const textStyles = useMemo(
    () => ({
      pct: { fontSize: 20, fontWeight: "700" as const, color: colors.textPrimary, lineHeight: 24 },
      sub: { fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5 },
    }),
    [colors]
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={textStyles.pct}>{clamped}%</Text>
        {!!label && <Text style={textStyles.sub}>{label}</Text>}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
