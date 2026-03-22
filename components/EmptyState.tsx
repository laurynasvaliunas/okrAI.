import React from "react";
import { View, StyleSheet } from "react-native";
import { space, radius, useTheme } from "../constants/theme";
import { Title3, Body } from "./Typography";
import Button from "./Button";

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default React.memo(function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      accessibilityRole="text"
    >
      {title ? <Title3 style={styles.title}>{title}</Title3> : null}
      <Body color={colors.textSecondary} style={styles.message}>
        {message}
      </Body>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="sm" style={styles.button} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xxl,
    alignItems: "center",
  },
  title: {
    marginBottom: space.sm,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: space.lg,
  },
});
