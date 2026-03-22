import React, { useEffect } from "react";
import { Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { space, radius, useTheme } from "../constants/theme";

const { width } = Dimensions.get("window");

type Props = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export default React.memo(function Toast({ visible, message, onDismiss, duration = 2600 }: Props) {
  const { colors, shadows } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (!visible || !message) {
      opacity.value = withTiming(0, { duration: 160 });
      return;
    }
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    const hide = () => {
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
      translateY.value = withTiming(6, { duration: 200 });
    };
    const t = setTimeout(hide, duration);
    return () => clearTimeout(t);
  }, [visible, message, duration, onDismiss, opacity, translateY]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, aStyle]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Animated.View style={[styles.box, { backgroundColor: colors.surfaceElevated }, shadows.md]}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 112,
    left: space.lg,
    right: space.lg,
    alignItems: "center",
    zIndex: 50,
    maxWidth: width - space.lg * 2,
    alignSelf: "center",
  },
  box: {
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
