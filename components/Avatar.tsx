import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../constants/theme";

type Size = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  size?: Size;
  color?: string;
}

const sizeMap: Record<Size, number> = { sm: 28, md: 40, lg: 72 };
const fontMap: Record<Size, number> = { sm: 12, md: 16, lg: 28 };

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default React.memo(function Avatar({ name, size = "md", color }: AvatarProps) {
  const { colors } = useTheme();
  const s = sizeMap[size];
  const f = fontMap[size];
  const bg = color ?? colors.accent;
  const textColor = bg === colors.accent ? colors.accentForeground : "#FFFFFF";

  const circle = useMemo(
    () => ({
      width: s,
      height: s,
      borderRadius: s / 2,
      backgroundColor: bg,
    }),
    [s, bg]
  );

  return (
    <View style={[styles.base, circle]} accessibilityLabel={name}>
      <Text style={[styles.text, { fontSize: f, color: textColor }]}>{getInitials(name)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
  },
});
