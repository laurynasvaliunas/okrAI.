import { useState } from "react";
import { View, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { space, radius, useTheme } from "../../constants/theme";
import { Headline, Body, BodyMedium, Caption } from "../../components/Typography";
import Button from "../../components/Button";
import { impactLight } from "../../lib/haptics";

const STYLES = [
  {
    id: "structured",
    title: "Structured & measurable",
    body: "I want crisp key results and a sense of control.",
  },
  {
    id: "adaptive",
    title: "Adaptive & humane",
    body: "I need room to change course without feeling like I failed.",
  },
  {
    id: "minimal",
    title: "Minimal & calm",
    body: "Keep the surface quiet — I'll go deep when I'm ready.",
  },
] as const;

const STORAGE_KEY = "@okrai/goal_style";

export default function GoalStyleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  async function onNext() {
    if (!selected) return;
    await AsyncStorage.setItem(STORAGE_KEY, selected);
    impactLight();
    router.push("/(onboarding)/first-objective");
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <View style={styles.inner}>
        <Caption color={colors.accent} style={styles.kicker}>
          YOUR STYLE
        </Caption>
        <Headline style={styles.title}>How do you like to pursue goals?</Headline>
        <Body color={colors.textSecondary} style={styles.lead}>
          This shapes tone — not rules. You can change it later.
        </Body>

        <View style={styles.list}>
          {STYLES.map((s) => {
            const on = selected === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => {
                  impactLight();
                  setSelected(s.id);
                }}
                style={[
                  styles.card,
                  {
                    borderColor: on ? colors.accent : colors.border,
                    backgroundColor: on ? colors.accentSoft : colors.surface,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <BodyMedium>{s.title}</BodyMedium>
                <Body color={colors.textSecondary} style={styles.cardBody}>
                  {s.body}
                </Body>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Continue"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selected}
          onPress={onNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: space.xxl,
    paddingTop: space.xl,
    paddingBottom: space.huge,
    justifyContent: "space-between",
  },
  kicker: {
    letterSpacing: 2,
    marginBottom: space.md,
    fontWeight: "700",
  },
  title: {
    marginBottom: space.sm,
  },
  lead: {
    marginBottom: space.xxl,
    lineHeight: 24,
  },
  list: {
    flex: 1,
    gap: space.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.xl,
  },
  cardBody: {
    marginTop: space.sm,
    lineHeight: 22,
  },
});
