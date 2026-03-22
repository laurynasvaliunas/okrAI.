import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useTheme } from "../constants/theme";

type ScreenProps = {
  children: React.ReactNode;
  /** Scroll when content may overflow */
  scroll?: boolean;
  edges?: Edge[];
  contentContainerStyle?: ViewStyle;
  keyboardOffsetIOS?: number;
  /** Status bar style follows theme */
  statusBarStyle?: "light" | "dark";
};

export default React.memo(function Screen({
  children,
  scroll = false,
  edges = ["top", "left", "right"],
  contentContainerStyle,
  keyboardOffsetIOS = 0,
  statusBarStyle,
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const barStyle = statusBarStyle ?? (isDark ? "light" : "dark");

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={barStyle === "light" ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardOffsetIOS}
      >
        <SafeAreaView style={styles.flex} edges={edges}>
          {body}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
