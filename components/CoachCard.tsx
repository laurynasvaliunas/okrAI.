import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { space, radius, useTheme, iconography } from "../constants/theme";
import { Title3, Body, Caption } from "./Typography";
import { impactLight } from "../lib/haptics";

type Props = {
  title: string;
  subtitle?: string;
  body?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  children?: React.ReactNode;
};

export default React.memo(function CoachCard({ title, subtitle, body, icon = "sparkles", onPress, children }: Props) {
  const { colors } = useTheme();

  const inner = (
    <>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name={icon} size={iconography.inlineSize} color={colors.accent} />
        </View>
        <View style={styles.textCol}>
          <Title3 style={styles.title}>{title}</Title3>
          {subtitle ? (
            <Caption color={colors.textTertiary} style={styles.subtitle}>
              {subtitle}
            </Caption>
          ) : null}
        </View>
      </View>
      {body ? (
        <Body color={colors.textSecondary} style={styles.body}>
          {body}
        </Body>
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.coachSurface, borderColor: colors.borderSubtle }]}
        onPress={() => {
          impactLight();
          onPress();
        }}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.coachSurface, borderColor: colors.borderSubtle }]}
      accessibilityRole="summary"
    >
      {inner}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    marginBottom: space.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    marginBottom: space.xxs,
  },
  subtitle: {
    marginTop: 0,
  },
  body: {
    marginTop: space.md,
    lineHeight: 22,
  },
});
