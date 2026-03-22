/**
 * Design system entry — re-exports tokens and theme hook.
 * Prefer `useTheme().colors` in components; avoid hard-coded palettes.
 */

export {
  space,
  radius,
  typography,
  motion,
  createShadows,
  a11y,
  iconography,
  blur,
  lightColors,
  darkColors,
  type SemanticColors,
  type ColorSchemeName,
  type ShadowKey,
} from "./tokens";

import { animLegacy, darkColors, createShadows } from "./tokens";

/** Legacy Animated.spring presets */
export const anim = animLegacy;

/** @deprecated Prefer `useTheme().colors` — static dark palette for legacy StyleSheets */
export const C = darkColors;

/** @deprecated Prefer `useTheme().shadows` — static dark shadows */
export const shadow = createShadows(true);

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_TARGET = 44;

export { ThemeProvider, useTheme, type ThemePreference } from "../providers/ThemeProvider";

/** @deprecated Use `useTheme().colors` — static snapshot for Stack headers only */
export const theme = {
  bg: darkColors.bg,
  surface: darkColors.surface,
  accent: darkColors.accent,
  textSecondary: darkColors.textSecondary,
};
