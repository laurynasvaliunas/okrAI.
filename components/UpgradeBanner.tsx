import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, space, radius } from "../constants/theme";
import { Body, Caption } from "./Typography";

export default function UpgradeBanner() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.accentSoft, borderColor: colors.accent },
      ]}
      onPress={() => router.push("/profile/upgrade")}
      activeOpacity={0.8}
    >
      <Ionicons name="sparkles" size={18} color={colors.accent} />
      <View style={styles.text}>
        <Body style={{ color: colors.accent, fontWeight: "600" }}>
          Upgrade to Pro
        </Body>
        <Caption style={{ color: colors.accent, opacity: 0.8 }}>
          You've reached the free limit of 3 goals
        </Caption>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});
