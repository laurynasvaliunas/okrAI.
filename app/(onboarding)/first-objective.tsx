import { useState } from "react";
import { View, StyleSheet, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { space, useTheme } from "../../constants/theme";
import { Headline, Body, Caption, Label } from "../../components/Typography";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useAuthStore } from "../../stores/authStore";
import { createObjective, createKeyResult, ALL_LIFE_AREAS, LIFE_AREA_MAP } from "../../lib/queries";
import { getFriendlyErrorMessage } from "../../lib/errors";
import { impactMedium, notifySuccess } from "../../lib/haptics";

export default function FirstObjectiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState("");
  const [krTitle, setKrTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<string>("career");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onContinue() {
    setError(null);
    if (!title.trim()) {
      setError("Give your objective a short, honest title.");
      return;
    }
    if (!krTitle.trim()) {
      setError("Add one measurable key result — even a simple one.");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const obj = await createObjective(
        {
          title: title.trim(),
          life_area: lifeArea,
          cadence: "quarterly",
        },
        user.id
      );
      await createKeyResult(
        {
          objective_id: obj.id,
          title: krTitle.trim(),
          metric_type: "percentage",
          start_value: 0,
          target_value: 100,
        },
        user.id
      );
      notifySuccess();
      impactMedium();
      router.push("/(onboarding)/life-areas");
    } catch (e: unknown) {
      setError(getFriendlyErrorMessage(e, "Could not save. Try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Caption color={colors.accent} style={styles.kicker}>
          FIRST OBJECTIVE
        </Caption>
        <Headline style={styles.title}>Name what matters next</Headline>
        <Body color={colors.textSecondary} style={styles.lead}>
          One objective, one measurable key result. You can refine later — this just gives you momentum.
        </Body>

        <Label style={styles.label}>Life area</Label>
        <View style={styles.chips}>
          {ALL_LIFE_AREAS.slice(0, 6).map((id) => {
            const m = LIFE_AREA_MAP[id];
            return (
              <Chip
                key={id}
                emoji={m.emoji}
                label={m.label}
                variant="filter"
                selected={lifeArea === id}
                onPress={() => setLifeArea(id)}
              />
            );
          })}
        </View>

        <Input placeholder="Objective title" value={title} onChangeText={setTitle} />
        <Input
          placeholder="Key result (e.g. Ship MVP to 10 beta users)"
          value={krTitle}
          onChangeText={setKrTitle}
        />

        {error ? (
          <Caption color={colors.error} style={styles.err}>
            {error}
          </Caption>
        ) : null}

        <Button
          title={loading ? "Saving…" : "Continue"}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={onContinue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: space.xxl,
    paddingBottom: space.huge,
    paddingTop: space.xl,
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
    marginBottom: space.xl,
    lineHeight: 24,
  },
  label: {
    marginBottom: space.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.lg,
  },
  err: {
    marginBottom: space.md,
  },
});
