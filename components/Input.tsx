import React, { useState, useCallback, useMemo } from "react";
import { View, TextInput, TextInputProps, StyleSheet } from "react-native";
import { radius, space, typography, useTheme } from "../constants/theme";
import { Label, Caption } from "./Typography";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export default React.memo(function Input({ label, error, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
      setFocused(true);
      rest.onFocus?.(e);
    },
    [rest]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
      setFocused(false);
      rest.onBlur?.(e);
    },
    [rest]
  );

  const borderColor = useMemo(() => {
    if (error) return colors.error;
    if (focused) return colors.accent;
    return colors.border;
  }, [error, focused, colors]);

  return (
    <View style={styles.container}>
      {label ? <Label style={styles.label}>{label.toUpperCase()}</Label> : null}
      <TextInput
        placeholderTextColor={colors.placeholder}
        {...rest}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            ...typography.body,
          },
          style,
        ]}
      />
      {error ? (
        <Caption color={colors.error} style={styles.error}>
          {error}
        </Caption>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: space.lg,
  },
  label: {
    marginBottom: space.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 15,
    minHeight: 50,
  },
  error: {
    marginTop: space.xs,
  },
});
