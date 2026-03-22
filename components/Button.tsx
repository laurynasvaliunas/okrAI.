import React, { useCallback, useMemo, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import { impactLight } from "../lib/haptics";
import { radius, space, anim, MIN_TOUCH_TARGET, useTheme } from "../constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  variant?: Variant;
  size?: Size;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default React.memo(function Button({
  title,
  variant = "primary",
  size = "md",
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, shadows } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const variantStyles = useMemo((): Record<Variant, { container: ViewStyle; text: TextStyle }> => {
    return {
      primary: {
        container: { backgroundColor: colors.accent },
        text: { color: colors.accentForeground },
      },
      secondary: {
        container: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.accent,
        },
        text: { color: colors.accent },
      },
      ghost: {
        container: { backgroundColor: "transparent" },
        text: { color: colors.accent },
      },
      destructive: {
        container: {
          backgroundColor: colors.errorSoft,
          borderWidth: 1,
          borderColor: colors.error + "40",
        },
        text: { color: colors.error },
      },
    };
  }, [colors]);

  const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
    sm: {
      container: {
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        minHeight: 36,
        borderRadius: radius.sm,
      },
      text: { fontSize: 13, fontWeight: "600" },
    },
    md: {
      container: {
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        minHeight: MIN_TOUCH_TARGET,
        borderRadius: radius.md,
      },
      text: { fontSize: 15, fontWeight: "600" },
    },
    lg: {
      container: {
        paddingHorizontal: space.xl,
        paddingVertical: space.lg,
        minHeight: 52,
        borderRadius: radius.md,
      },
      text: { fontSize: 16, fontWeight: "700" },
    },
  };

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, ...anim.spring.stiff }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, ...anim.spring.default }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    impactLight();
    onPress();
  }, [onPress]);

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const textColor = disabled ? colors.placeholder : v.text.color;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          styles.base,
          v.container,
          s.container,
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          variant === "primary" && !disabled && shadows.sm,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor as string} size="small" />
        ) : (
          <Animated.Text style={[styles.text, s.text, { color: textColor }]}>{title}</Animated.Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  fullWidth: {
    width: "100%",
  },
});
