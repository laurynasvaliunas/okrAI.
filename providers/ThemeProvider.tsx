import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ColorSchemeName,
  SemanticColors,
  createShadows,
  darkColors,
  lightColors,
} from "../constants/tokens";

const STORAGE_KEY = "@okrai/theme_preference";

export type ThemePreference = "system" | "light" | "dark";

export type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  resolvedScheme: ColorSchemeName;
  colors: SemanticColors;
  shadows: ReturnType<typeof createShadows>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPrefState] = useState<ThemePreference>("light");

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setPrefState(v);
    });
  }, []);

  const resolvedScheme: ColorSchemeName = useMemo(() => {
    if (preference === "light") return "light";
    if (preference === "dark") return "dark";
    return systemScheme === "light" ? "light" : "dark";
  }, [preference, systemScheme]);

  const isDark = resolvedScheme === "dark";
  const colors = isDark ? darkColors : lightColors;
  const shadows = useMemo(() => createShadows(isDark), [isDark]);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPrefState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      colors,
      shadows,
      isDark,
    }),
    [preference, setPreference, resolvedScheme, colors, shadows, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
