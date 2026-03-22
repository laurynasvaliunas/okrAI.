import { View, StyleSheet, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { space, useTheme } from "../../constants/theme";
import { Display, Title2, Body, Caption } from "../../components/Typography";
import Button from "../../components/Button";

export default function ValuePropositionScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <LinearGradient colors={[colors.bg, colors.surface]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Caption color={colors.accent} style={styles.kicker}>
            WHY OKRAI
          </Caption>
          <Display style={styles.headline}>Clarity without the noise</Display>
          <Title2 color={colors.textSecondary} style={styles.sub}>
            OKRAI turns ambition into measurable objectives and weekly rhythm — so progress feels calm, not chaotic.
          </Title2>
          <View style={styles.block}>
            <Body color={colors.textSecondary}>
              You get one honest snapshot of momentum, a coach that respects your intelligence, and check-ins designed
              to take minutes — not meetings.
            </Body>
          </View>
        </ScrollView>
      </LinearGradient>
      <View style={[styles.footer, { backgroundColor: colors.bg }]}>
        <Button title="Continue" variant="primary" size="lg" fullWidth onPress={() => router.push("/(onboarding)/goal-style")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  kicker: {
    letterSpacing: 2,
    marginBottom: space.lg,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: space.xxl,
    paddingBottom: space.xxl,
    paddingTop: space.md,
  },
  headline: {
    marginBottom: space.md,
  },
  sub: {
    fontWeight: "400",
    marginBottom: space.xxl,
    lineHeight: 26,
  },
  block: {
    marginTop: space.sm,
  },
  footer: {
    paddingHorizontal: space.xxl,
    paddingBottom: space.huge,
  },
});
