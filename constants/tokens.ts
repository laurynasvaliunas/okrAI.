import type { TextStyle, ViewStyle } from "react-native";

/**
 * OKRAI design tokens — semantic colors, motion, accessibility.
 * Light/dark palettes tuned for calm, premium readability (WCAG-oriented).
 */

export type ColorSchemeName = "light" | "dark";

export interface SemanticColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  placeholder: string;
  inverseText: string;
  accent: string;
  accentMuted: string;
  /** @deprecated use accentMuted — kept for component clarity */
  accentSoft: string;
  accentForeground: string;
  momentum: string;
  momentumMuted: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  scrim: string;
  focusRing: string;
  coachSurface: string;
}

/** Aligns with Figma Make “Enhance OKR AI Coach” theme.css */
export const lightColors: SemanticColors = {
  bg: "#FAFAF8",
  bgSecondary: "#F5F5F3",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.88)",
  border: "#E5E5E0",
  borderSubtle: "#F0F0ED",
  textPrimary: "#1C1C1E",
  textSecondary: "#636366",
  textTertiary: "#8E8E93",
  placeholder: "#AEAEB2",
  inverseText: "#FFFFFF",
  accent: "#C66A4F",
  accentMuted: "rgba(217, 119, 88, 0.18)",
  accentSoft: "rgba(217, 119, 88, 0.18)",
  accentForeground: "#FFFFFF",
  momentum: "#D4B896",
  momentumMuted: "rgba(212,184,150,0.16)",
  success: "#4CD964",
  successSoft: "rgba(76,217,100,0.12)",
  warning: "#C27A1A",
  warningSoft: "rgba(194,122,26,0.12)",
  error: "#FF6B6B",
  errorSoft: "rgba(255,107,107,0.12)",
  info: "#2A6B8F",
  infoSoft: "rgba(42,107,143,0.10)",
  overlay: "rgba(28,28,30,0.04)",
  scrim: "rgba(12,12,14,0.45)",
  focusRing: "#C66A4F",
  coachSurface: "#F8F8F6",
};

export const darkColors: SemanticColors = {
  bg: "#0B0D0D",
  bgSecondary: "#121516",
  surface: "#161A1A",
  surfaceElevated: "#1E2323",
  surfaceGlass: "rgba(28,32,32,0.65)",
  border: "#2A3030",
  borderSubtle: "#1F2424",
  textPrimary: "#F2F4F3",
  textSecondary: "#9BA3A1",
  textTertiary: "#6B7371",
  placeholder: "#4A5250",
  inverseText: "#FFFFFF",
  accent: "#D97758",
  accentMuted: "rgba(217, 119, 88, 0.18)",
  accentSoft: "rgba(217, 119, 88, 0.18)",
  accentForeground: "#FFFFFF",
  momentum: "#D4B896",
  momentumMuted: "rgba(212,184,150,0.14)",
  success: "#4CD964",
  successSoft: "rgba(76,217,100,0.14)",
  warning: "#FFB340",
  warningSoft: "rgba(255,179,64,0.14)",
  error: "#FF6B6B",
  errorSoft: "rgba(255,107,107,0.12)",
  info: "#64D2FF",
  infoSoft: "rgba(100,210,255,0.12)",
  overlay: "rgba(255,255,255,0.04)",
  scrim: "rgba(0,0,0,0.55)",
  focusRing: "#D97758",
  coachSurface: "#1A1F1F",
};

/** 4/8-based spacing scale */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

type TypographyToken = Pick<TextStyle, "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing" | "fontVariant">;

export const typography: Record<string, TypographyToken> = {
  display: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  title1: { fontSize: 22, fontWeight: "600", lineHeight: 28, letterSpacing: -0.35 },
  title2: { fontSize: 18, fontWeight: "600", lineHeight: 24, letterSpacing: -0.2 },
  title3: { fontSize: 16, fontWeight: "600", lineHeight: 22, letterSpacing: 0 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24, letterSpacing: 0.1 },
  bodyMedium: { fontSize: 16, fontWeight: "500", lineHeight: 24, letterSpacing: 0.1 },
  label: { fontSize: 13, fontWeight: "600", lineHeight: 18, letterSpacing: 0.6 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16, letterSpacing: 0.15 },
  small: { fontSize: 11, fontWeight: "600", lineHeight: 14, letterSpacing: 0.35 },
  /** Tabular figures for metrics */
  numeric: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 32,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  numericLarge: {
    fontSize: 44,
    fontWeight: "700",
    lineHeight: 48,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
};

export type ShadowKey = "none" | "xs" | "sm" | "md" | "lg";

type ShadowToken = Pick<ViewStyle, "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius"> & {
  elevation: number;
};

export function createShadows(isDark: boolean): Record<ShadowKey, ShadowToken> {
  const key = isDark ? "#000000" : "#1C1C1E";
  return {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: key,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: key,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: key,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.1,
      shadowRadius: 14,
      elevation: 6,
    },
    lg: {
      shadowColor: key,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.5 : 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
  };
}

/** Motion: durations (ms) and Reanimated spring presets */
export const motion = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 280,
    slow: 420,
    slower: 560,
  },
  easing: {
    standard: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } as const,
    emphasized: { x1: 0.2, y1: 0, x2: 0, y2: 1 } as const,
    exit: { x1: 0.4, y1: 0, x2: 1, y2: 1 } as const,
  },
  spring: {
    soft: { damping: 22, stiffness: 180, mass: 0.8 },
    snappy: { damping: 18, stiffness: 320, mass: 0.6 },
    sheet: { damping: 28, stiffness: 280, mass: 1 },
  },
} as const;

/** Legacy `anim` compatibility for Animated.spring */
export const animLegacy = {
  spring: {
    default: { tension: 100, friction: 12, useNativeDriver: true },
    bouncy: { tension: 180, friction: 12, useNativeDriver: true },
    stiff: { tension: 300, friction: 20, useNativeDriver: true },
  },
  duration: motion.duration,
} as const;

export const a11y = {
  minTapTarget: 44,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 } as const,
  maxFontScale: 1.35,
} as const;

export const iconography = {
  tabSize: 24,
  inlineSize: 20,
  listSize: 22,
  strokeWidth: 1.75,
} as const;

export const blur = {
  sheet: 24,
  header: 16,
} as const;
