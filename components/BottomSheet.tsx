import React, { useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, space, useTheme } from "../constants/theme";
import { Title2 } from "./Typography";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default React.memo(function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const sheetStyle = useMemo(
    () => ({
      backgroundColor: colors.surfaceElevated,
      paddingBottom: insets.bottom + space.xxl,
    }),
    [colors.surfaceElevated, insets.bottom]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.scrim }]} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrapper}
      >
        <View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.placeholder }]} />
          </View>
          {title ? <Title2 style={styles.title}>{title}</Title2> : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xxl,
  },
  handleRow: {
    alignItems: "center",
    marginBottom: space.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    marginBottom: space.xl,
  },
});
