import React, { useMemo } from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { radius, space, useTheme, type ShadowKey } from "../constants/theme";

type Elevation = "none" | "xs" | "sm" | "md" | "lg";

interface CardProps extends ViewProps {
  elevation?: Elevation;
}

const mapElevation: Record<Elevation, ShadowKey> = {
  none: "none",
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
};

export default React.memo(function Card({ elevation = "sm", style, children, ...rest }: CardProps) {
  const { colors, shadows } = useTheme();
  const shadowKey = mapElevation[elevation];
  const shadowStyle = shadows[shadowKey];

  const dynamic = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    }),
    [colors]
  );

  return (
    <View style={[styles.base, dynamic, shadowStyle, style]} {...rest}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: space.lg,
  },
});
