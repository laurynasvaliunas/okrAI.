/**
 * Safe haptics wrappers — silently no-op on simulators or when expo-haptics
 * is not natively linked (e.g. running in Expo Go).
 */
import * as Haptics from "expo-haptics";

export function impactLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function impactMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function notifySuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function notifyError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Selection change — toggles, segments, pickers */
export function selection() {
  Haptics.selectionAsync().catch(() => {});
}

/** Warning / soft alert */
export function notifyWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
