import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { typography, useTheme } from "../constants/theme";

type TypoProps = TextProps & { color?: string };

function makeVariant(
  token: keyof typeof typography,
  secondary: boolean
): React.MemoExoticComponent<(props: TypoProps) => React.ReactElement> {
  return React.memo(function TypoComponent({ color, style, ...rest }: TypoProps) {
    const { colors } = useTheme();
    const defaultColor = secondary ? colors.textSecondary : colors.textPrimary;
    return (
      <Text
        style={[typography[token] as TextStyle, { color: color ?? defaultColor }, style]}
        {...rest}
      />
    );
  });
}

export const Display = makeVariant("display", false);
export const Headline = makeVariant("headline", false);
export const Title1 = makeVariant("title1", false);
export const Title2 = makeVariant("title2", false);
export const Title3 = makeVariant("title3", false);
export const Body = makeVariant("body", false);
export const BodyMedium = makeVariant("bodyMedium", false);
export const Label = makeVariant("label", true);
export const Caption = makeVariant("caption", true);
export const Small = makeVariant("small", true);
export const Numeric = makeVariant("numeric", false);
export const NumericLarge = makeVariant("numericLarge", false);
