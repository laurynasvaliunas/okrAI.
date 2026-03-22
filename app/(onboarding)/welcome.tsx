import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { space, useTheme } from "../../constants/theme";
import { Display, Title2, Body, BodyMedium } from "../../components/Typography";
import Card from "../../components/Card";
import Button from "../../components/Button";

const EXPLAINER = [
  {
    emoji: "🎯",
    heading: "Set goals that actually matter",
    body: "OKRs help you get clear on what you want — not just tasks, but real outcomes that move your life forward.",
  },
  {
    emoji: "📈",
    heading: "Know if you're making progress",
    body: "Each goal has simple numbers that tell you how close you are. No guessing. No vague 'doing my best'.",
  },
  {
    emoji: "🔄",
    heading: "Reflect and adjust as you grow",
    body: "Life changes. Your goals can too. Review weekly, adapt monthly, and keep moving toward what counts.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { colors, isDark } = useTheme();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      <View style={styles.top}>
        <Display>Hi {firstName}</Display>
        <Title2 color={colors.textSecondary} style={styles.subtitle}>
          Let's set up your personal OKR coach
        </Title2>
      </View>

      <View style={styles.cards}>
        {EXPLAINER.map((item) => (
          <Card key={item.emoji} elevation="sm" style={styles.card}>
            <View style={styles.cardEmoji}>
              <Display>{item.emoji}</Display>
            </View>
            <View style={styles.cardText}>
              <BodyMedium style={styles.cardHeading}>{item.heading}</BodyMedium>
              <Body color={colors.textSecondary}>{item.body}</Body>
            </View>
          </Card>
        ))}
      </View>

      <Button
        title="Get Started"
        variant="primary"
        size="lg"
        fullWidth
        onPress={() => router.push("/(onboarding)/value-proposition")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.huge,
    justifyContent: "space-between",
  },
  top: {
    marginBottom: space.sm,
  },
  subtitle: {
    marginTop: space.sm,
    fontWeight: "400",
  },
  cards: {
    flex: 1,
    justifyContent: "center",
    gap: space.md,
    paddingVertical: space.xxl,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.lg,
    padding: space.xl,
  },
  cardEmoji: {
    marginTop: 1,
  },
  cardText: {
    flex: 1,
  },
  cardHeading: {
    marginBottom: space.xs,
  },
});
