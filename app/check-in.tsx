import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { impactMedium, notifySuccess } from "../lib/haptics";
import { space, radius, useTheme, typography } from "../constants/theme";
import { Display, Title2, Body, Caption } from "../components/Typography";
import Button from "../components/Button";
import Card from "../components/Card";
import CheckInSlider from "../components/CheckInSlider";
import CoachCard from "../components/CoachCard";
import { useAuthStore } from "../stores/authStore";
import { invokePersonalCoach } from "../lib/personalCoachInvoke";
import { saveWeeklyCheckIn, getObjectives } from "../lib/queries";

const STEPS = ["ground", "confidence", "wins", "blockers", "next", "summary"] as const;
type Step = (typeof STEPS)[number];

export default function WeeklyCheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("ground");
  const [confidence, setConfidence] = useState(72);
  const [wins, setWins] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  const advance = useCallback(() => {
    impactMedium();
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }, [step]);

  const back = useCallback(() => {
    impactMedium();
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
    else router.back();
  }, [step, router]);

  // Generate AI summary then advance to summary step
  const handleSeeResults = useCallback(async () => {
    impactMedium();
    setGeneratingSummary(true);

    const firstName = profile?.full_name?.split(" ")[0];
    const prompt = [
      `Weekly check-in from ${firstName ?? "the user"}.`,
      `Direction confidence: ${confidence}%.`,
      wins.trim() ? `Wins this week: ${wins.trim()}` : "No wins noted.",
      blockers.trim() ? `Friction: ${blockers.trim()}` : "No blockers noted.",
      nextStep.trim() ? `Next step they've committed to: ${nextStep.trim()}` : "No next step defined.",
      "",
      "In 2-3 warm, direct sentences: acknowledge what moved, name one clear friction pattern, and give one specific action they can take this week. No bullet points. No corporate language.",
    ].join("\n");

    try {
      if (user) {
        const { data } = await invokePersonalCoach({
          message: prompt,
          userId: user.id,
          context: "",
          userName: firstName,
          conversation: [],
        });
        if (data?.message) setAiSummary(data.message as string);
      }
    } catch {
      // AI unavailable — use a thoughtful fallback
      setAiSummary(
        `You showed up — that matters. ${blockers.trim() ? `The friction around "${blockers.trim().slice(0, 60)}" is worth naming to your coach.` : "Keep the momentum steady."} ${nextStep.trim() ? `Your next step is clear: ${nextStep.trim().slice(0, 80)}.` : "Define one concrete next step before the week starts."}`
      );
    } finally {
      setGeneratingSummary(false);
      setStep("summary");
    }
  }, [confidence, wins, blockers, nextStep, user, profile]);

  const finish = useCallback(async () => {
    if (!user) { router.back(); return; }

    setSaving(true);
    try {
      const inputText = [
        `confidence:${confidence}`,
        wins.trim() ? `wins:${wins.trim()}` : "",
        blockers.trim() ? `blockers:${blockers.trim()}` : "",
        nextStep.trim() ? `next:${nextStep.trim()}` : "",
      ].filter(Boolean).join(" | ");

      // Count active objectives so Insights can show "X goals reviewed"
      let goalsReviewed = 0;
      try {
        const objs = await getObjectives(user.id);
        goalsReviewed = objs.filter((o) => o.status === "active").length;
      } catch { /* non-fatal */ }

      await saveWeeklyCheckIn({
        user_id: user.id,
        entity_id: user.id,
        input_text: inputText,
        coaching_response: { message: aiSummary ?? "" },
        goals_reviewed: goalsReviewed,
      });

      // Invalidate so Home / Insights / Profile all reflect the new check-in
      void queryClient.invalidateQueries({ queryKey: ["objectives", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["profileStats", user.id] });
      notifySuccess();
    } catch {
      // Save failing silently — don't block the user
    } finally {
      setSaving(false);
      router.back();
    }
  }, [user, confidence, wins, blockers, nextStep, aiSummary, queryClient, router]);

  const summaryBody =
    aiSummary ??
    "Your check-in is being processed. Keep your next step visible — it's your contract with yourself for the week ahead.";

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.huge },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Caption color={colors.textTertiary} style={styles.kicker}>
          WEEKLY CHECK-IN · ~2 MIN
        </Caption>

        {step === "ground" && (
          <>
            <Display style={styles.title}>A calm pulse check</Display>
            <Body color={colors.textSecondary} style={styles.lead}>
              No judgment — just clarity. We'll capture how things feel, what moved, and what's in the way.
            </Body>
            <CoachCard
              icon="heart-outline"
              title="Emotionally safe by design"
              body="If you missed days, that's data — not a verdict. We optimize for honesty, not streak anxiety."
            />
            <Button title="Begin" variant="primary" size="lg" fullWidth onPress={advance} />
          </>
        )}

        {step === "confidence" && (
          <>
            <Title2 style={styles.title}>Confidence in your direction</Title2>
            <Body color={colors.textSecondary} style={styles.lead}>
              How aligned do you feel with your objectives right now?
            </Body>
            <CheckInSlider label="Direction confidence" value={confidence} onChange={setConfidence} />
            <View style={styles.actions}>
              <Button title="Back" variant="ghost" size="md" onPress={back} />
              <Button title="Continue" variant="primary" size="md" onPress={advance} />
            </View>
          </>
        )}

        {step === "wins" && (
          <>
            <Title2 style={styles.title}>Wins — even small ones</Title2>
            <Body color={colors.textSecondary} style={styles.lead}>
              What moved forward? A sentence is enough.
            </Body>
            <Card elevation="sm">
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g. Shipped the draft, protected two deep-work mornings…"
                placeholderTextColor={colors.placeholder}
                value={wins}
                onChangeText={setWins}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Wins this week"
              />
            </Card>
            <View style={styles.actions}>
              <Button title="Back" variant="ghost" size="md" onPress={back} />
              <Button title="Continue" variant="primary" size="md" onPress={advance} />
            </View>
          </>
        )}

        {step === "blockers" && (
          <>
            <Title2 style={styles.title}>Friction, without shame</Title2>
            <Body color={colors.textSecondary} style={styles.lead}>
              What slowed you down? Naming it reduces its weight.
            </Body>
            <Card elevation="sm">
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Context switching, unclear next step, energy…"
                placeholderTextColor={colors.placeholder}
                value={blockers}
                onChangeText={setBlockers}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Blockers"
              />
            </Card>
            <View style={styles.actions}>
              <Button title="Back" variant="ghost" size="md" onPress={back} />
              <Button title="Continue" variant="primary" size="md" onPress={advance} />
            </View>
          </>
        )}

        {step === "next" && (
          <>
            <Title2 style={styles.title}>One next step</Title2>
            <Body color={colors.textSecondary} style={styles.lead}>
              Not ten tasks — the single most leverage-rich move for the next 7 days.
            </Body>
            <Card elevation="sm">
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Your next intentional step…"
                placeholderTextColor={colors.placeholder}
                value={nextStep}
                onChangeText={setNextStep}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Next step"
              />
            </Card>
            <View style={styles.actions}>
              <Button title="Back" variant="ghost" size="md" onPress={back} />
              <Button
                title={generatingSummary ? "Reflecting…" : "See summary"}
                variant="primary"
                size="md"
                onPress={handleSeeResults}
                disabled={generatingSummary}
                loading={generatingSummary}
              />
            </View>
          </>
        )}

        {step === "summary" && (
          <>
            <Title2 style={styles.title}>Your week, reflected</Title2>
            <Body color={colors.textSecondary} style={styles.lead}>
              A concise read — swap guilt for clarity.
            </Body>
            <CoachCard
              icon="sparkles"
              title="Coach reflection"
              body={summaryBody}
            />

            {/* Confidence snapshot */}
            <Card elevation="sm" style={styles.snapshotCard}>
              <Caption color={colors.textTertiary} style={styles.snapshotLabel}>
                DIRECTION CONFIDENCE
              </Caption>
              <Body color={colors.textPrimary} style={styles.snapshotValue}>
                {confidence}%{" "}
                <Body color={colors.textSecondary}>
                  {confidence >= 80 ? "— you're locked in." : confidence >= 55 ? "— solid footing." : "— worth a re-alignment."}
                </Body>
              </Body>
            </Card>

            {nextStep.trim() ? (
              <Card elevation="sm" style={styles.snapshotCard}>
                <Caption color={colors.textTertiary} style={styles.snapshotLabel}>
                  YOUR COMMITMENT
                </Caption>
                <Body color={colors.textPrimary}>{nextStep.trim()}</Body>
              </Card>
            ) : null}

            <Button
              title={saving ? "Saving…" : "Done"}
              variant="primary"
              size="lg"
              fullWidth
              onPress={finish}
              disabled={saving}
              loading={saving}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
  },
  kicker: {
    letterSpacing: 1,
    marginBottom: space.md,
  },
  title: {
    marginBottom: space.sm,
  },
  lead: {
    marginBottom: space.xl,
    lineHeight: 24,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
    ...typography.body,
  },
  actions: {
    flexDirection: "row",
    gap: space.md,
    marginTop: space.lg,
    justifyContent: "space-between",
  },
  snapshotCard: {
    marginBottom: space.md,
    padding: space.lg,
  },
  snapshotLabel: {
    letterSpacing: 0.8,
    marginBottom: space.sm,
  },
  snapshotValue: {
    lineHeight: 24,
  },
});
