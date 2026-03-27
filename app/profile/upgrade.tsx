import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import RevenueCatUI from "react-native-purchases-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

export default function UpgradeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  function handleDismiss() {
    queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <RevenueCatUI.Paywall
        options={{ displayCloseButton: true }}
        onDismiss={handleDismiss}
        onPurchaseCompleted={handleDismiss}
        onRestoreCompleted={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
