import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { space, radius, useTheme } from "../constants/theme";
import { Title2, Title3, BodyMedium, Body, Caption, Label, Small } from "./Typography";
import Button from "./Button";
import { createKeyResult } from "../lib/queries";
import { suggestKeyResults, type KrSuggestion } from "../lib/suggestKeyResults";
import { getFriendlyErrorMessage } from "../lib/errors";

// ─── Local fallback suggestions ───────────────────────────────────────────────

const LOCAL_SUGGESTIONS: Record<string, KrSuggestion[]> = {
  health: [
    { title: "Complete workouts", metric_type: "number", start_value: 0, target_value: 12, unit: "sessions", rationale: "Builds a consistent movement habit across the quarter." },
    { title: "Average daily steps", metric_type: "number", start_value: 0, target_value: 10000, unit: "steps", rationale: "Tracks overall daily activity without needing gym time." },
    { title: "Alcohol-free days per week", metric_type: "number", start_value: 0, target_value: 5, unit: "days/wk", rationale: "Improves sleep, energy, and mental clarity." },
  ],
  career: [
    { title: "Projects delivered on time", metric_type: "number", start_value: 0, target_value: 4, unit: "projects", rationale: "Demonstrates reliability and execution to stakeholders." },
    { title: "Skills learned", metric_type: "number", start_value: 0, target_value: 2, unit: "skills", rationale: "Keeps your expertise sharp in a fast-moving field." },
    { title: "Performance score", metric_type: "percentage", start_value: 70, target_value: 90, rationale: "A direct signal of career growth and impact." },
  ],
  finance: [
    { title: "Monthly savings", metric_type: "number", start_value: 0, target_value: 1000, unit: "$", rationale: "Creates financial resilience one month at a time." },
    { title: "Emergency fund", metric_type: "number", start_value: 0, target_value: 5000, unit: "$", rationale: "3–6 months of expenses is the foundation of financial health." },
    { title: "Spending under budget", metric_type: "percentage", start_value: 100, target_value: 85, rationale: "Reduces financial stress and accelerates goals." },
  ],
  relationships: [
    { title: "Meaningful 1:1s per month", metric_type: "number", start_value: 0, target_value: 4, unit: "conversations", rationale: "Deep connection requires regular, undivided attention." },
    { title: "Family dinners per week", metric_type: "number", start_value: 0, target_value: 3, unit: "dinners", rationale: "Consistent rituals strengthen family bonds over time." },
    { title: "Reach out to old friends", metric_type: "number", start_value: 0, target_value: 6, unit: "people", rationale: "Rekindling old friendships enriches your support network." },
  ],
  learning: [
    { title: "Books read", metric_type: "number", start_value: 0, target_value: 3, unit: "books", rationale: "Reading consistently compounds knowledge across time." },
    { title: "Courses completed", metric_type: "number", start_value: 0, target_value: 2, unit: "courses", rationale: "Structured learning accelerates skill acquisition." },
    { title: "Daily practice sessions", metric_type: "number", start_value: 0, target_value: 65, unit: "sessions", rationale: "Small, consistent practice beats occasional intense study." },
  ],
  mindfulness: [
    { title: "Meditation sessions", metric_type: "number", start_value: 0, target_value: 60, unit: "sessions", rationale: "Daily practice rewires stress response over 90 days." },
    { title: "Journaling streak", metric_type: "number", start_value: 0, target_value: 50, unit: "entries", rationale: "Writing processes emotion and builds self-awareness." },
    { title: "Phone-free mornings", metric_type: "number", start_value: 0, target_value: 50, unit: "mornings", rationale: "Starting the day with intention improves mood and focus." },
  ],
  creativity: [
    { title: "Creative sessions per week", metric_type: "number", start_value: 0, target_value: 3, unit: "sessions", rationale: "Regular creative time builds confidence and skill." },
    { title: "Projects shipped", metric_type: "number", start_value: 0, target_value: 2, unit: "projects", rationale: "Finishing is the hardest part — track completions, not starts." },
    { title: "Hours in deep work", metric_type: "number", start_value: 0, target_value: 50, unit: "hours", rationale: "Deep creative work requires protection from distraction." },
  ],
  other: [
    { title: "Weekly progress check-ins", metric_type: "number", start_value: 0, target_value: 12, unit: "check-ins", rationale: "Regular reflection keeps you on course." },
    { title: "Habit completed", metric_type: "boolean", start_value: 0, target_value: 1, rationale: "Done is the foundation of every goal." },
    { title: "Consistency rate", metric_type: "percentage", start_value: 0, target_value: 80, rationale: "80% consistency creates lasting change." },
  ],
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function endOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().split("T")[0];
}

function endOfMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
}

function endOfQuarter(): string {
  const d = new Date();
  const month = d.getMonth();
  const quarterEndMonth = Math.floor(month / 3) * 3 + 2;
  const last = new Date(d.getFullYear(), quarterEndMonth + 1, 0);
  return last.toISOString().split("T")[0];
}

const AREA_PLACEHOLDERS: Record<string, string> = {
  health: "e.g. Complete 12 workouts",
  career: "e.g. Ship 4 projects on time",
  finance: "e.g. Save $1,000 per month",
  relationships: "e.g. Weekly dinner with family",
  learning: "e.g. Read 3 books this quarter",
  mindfulness: "e.g. Meditate 60 sessions",
  creativity: "e.g. Publish 2 creative projects",
  other: "e.g. Build a consistent habit",
};

// ─── Metric type cards ────────────────────────────────────────────────────────

const METRIC_OPTIONS: { id: "number" | "percentage" | "boolean"; icon: string; label: string; sub: string }[] = [
  { id: "number", icon: "📊", label: "Number", sub: "Count something concrete" },
  { id: "percentage", icon: "%", label: "Percentage", sub: "Track growth or rate" },
  { id: "boolean", icon: "✅", label: "Done", sub: "Complete or not" },
];

// ─── Suggestion card ──────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onPress,
}: {
  suggestion: KrSuggestion;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const metricLabel =
    suggestion.metric_type === "boolean"
      ? "Done"
      : suggestion.metric_type === "percentage"
      ? "%"
      : "Number";

  const targetDisplay =
    suggestion.metric_type === "boolean"
      ? "Complete"
      : `${suggestion.target_value}${suggestion.unit ? " " + suggestion.unit : ""}`;

  return (
    <TouchableOpacity
      style={[s.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={s.suggestionCardTop}>
        <BodyMedium style={s.suggestionTitle} numberOfLines={2}>
          {suggestion.title}
        </BodyMedium>
        <View style={s.suggestionMeta}>
          <View style={[s.metricBadge, { backgroundColor: colors.accentMuted }]}>
            <Small color={colors.accent}>{metricLabel}</Small>
          </View>
          <Caption color={colors.textSecondary}>{targetDisplay}</Caption>
        </View>
      </View>
      <Caption color={colors.textTertiary} style={s.suggestionRationale}>
        {suggestion.rationale}
      </Caption>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const { colors } = useTheme();
  return <View style={[s.skeletonCard, { backgroundColor: colors.surface }]} />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddKrSheetProps {
  visible: boolean;
  onClose: () => void;
  objectiveId: string;
  objectiveTitle: string;
  lifeArea: string;
  objectiveDescription: string | null;
  userId: string;
  userName?: string;
  onAdded: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AddKrSheet({
  visible,
  onClose,
  objectiveId,
  objectiveTitle,
  lifeArea,
  objectiveDescription,
  userId,
  userName,
  onAdded,
}: AddKrSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Step state
  const [step, setStep] = useState<"suggestions" | "form">("suggestions");

  // Suggestions state
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<KrSuggestion[]>([]);
  const [chosenSuggestion, setChosenSuggestion] = useState<KrSuggestion | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [metricType, setMetricType] = useState<"number" | "percentage" | "boolean">("number");
  const [startVal, setStartVal] = useState("0");
  const [targetVal, setTargetVal] = useState("");
  const [unit, setUnit] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const results = await suggestKeyResults(
        objectiveTitle,
        lifeArea,
        objectiveDescription,
        userId,
        userName
      );
      setSuggestions(results);
    } catch {
      const fallback = LOCAL_SUGGESTIONS[lifeArea] ?? LOCAL_SUGGESTIONS.other;
      setSuggestions(fallback);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [objectiveTitle, lifeArea, objectiveDescription, userId, userName]);

  useEffect(() => {
    if (visible) {
      setStep("suggestions");
      setSuggestions([]);
      setChosenSuggestion(null);
      resetForm();
      fetchSuggestions();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setTitle("");
    setMetricType("number");
    setStartVal("0");
    setTargetVal("");
    setUnit("");
    setDueDate(null);
    setFormError(null);
  }

  function fillFormFromSuggestion(sg: KrSuggestion) {
    setTitle(sg.title);
    setMetricType(sg.metric_type);
    setStartVal(String(sg.start_value));
    setTargetVal(sg.metric_type === "boolean" ? "1" : String(sg.target_value));
    setUnit(sg.unit ?? "");
    setDueDate(null);
    setFormError(null);
  }

  function handleSelectSuggestion(sg: KrSuggestion) {
    setChosenSuggestion(sg);
    fillFormFromSuggestion(sg);
    setStep("form");
  }

  function handleStartFromScratch() {
    setChosenSuggestion(null);
    resetForm();
    setStep("form");
  }

  async function handleSubmit() {
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (metricType !== "boolean" && !targetVal.trim()) {
      setFormError("Target value is required.");
      return;
    }

    const target = metricType === "boolean" ? 1 : parseFloat(targetVal);
    const start = metricType === "boolean" ? 0 : parseFloat(startVal || "0");

    if (metricType !== "boolean" && isNaN(target)) {
      setFormError("Target value must be a number.");
      return;
    }

    setSubmitting(true);
    try {
      await createKeyResult(
        {
          objective_id: objectiveId,
          title: title.trim(),
          metric_type: metricType,
          start_value: start,
          target_value: target,
          unit: unit.trim() || undefined,
          due_date: dueDate ?? undefined,
        },
        userId
      );
      onAdded();
    } catch (err: unknown) {
      setFormError(getFriendlyErrorMessage(err, "Failed to add key result."));
    } finally {
      setSubmitting(false);
    }
  }

  const placeholder = AREA_PLACEHOLDERS[lifeArea] ?? "e.g. Reach your goal";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[s.overlay, { backgroundColor: colors.scrim }]}>
        <KeyboardAvoidingView
          style={s.sheetWrapper}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[s.sheet, { backgroundColor: colors.surfaceElevated, paddingBottom: insets.bottom + space.xl }]}>
            {/* Handle bar */}
            <View style={[s.handle, { backgroundColor: colors.border }]} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.scrollContent}
            >
              {step === "suggestions" ? (
                <>
                  {/* Suggestions header */}
                  <View style={s.sheetHeader}>
                    <View style={s.flex1} />
                    <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Title2 style={s.sheetTitle}>What will you measure?</Title2>
                  <Body color={colors.textSecondary} style={s.sheetSubtitle}>
                    Great key results are specific, measurable, and time-bound.
                  </Body>

                  {loadingSuggestions ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : (
                    suggestions.map((sg, i) => (
                      <SuggestionCard
                        key={i}
                        suggestion={sg}
                        onPress={() => handleSelectSuggestion(sg)}
                      />
                    ))
                  )}

                  <TouchableOpacity onPress={handleStartFromScratch} style={s.scratchLink}>
                    <Body color={colors.accent}>Start from scratch →</Body>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Form header */}
                  <View style={s.sheetHeader}>
                    <TouchableOpacity
                      onPress={() => setStep("suggestions")}
                      style={s.backBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="arrow-back" size={22} color={colors.accent} />
                    </TouchableOpacity>
                    <View style={s.flex1} />
                    <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Title field */}
                  <Label style={[s.fieldLabel, { color: colors.textTertiary }]}>KEY RESULT</Label>
                  <TextInput
                    style={[s.titleInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    value={title}
                    onChangeText={(v) => { setTitle(v); setFormError(null); }}
                    multiline
                    maxLength={160}
                  />

                  {/* Rationale hint */}
                  {chosenSuggestion ? (
                    <View style={[s.rationaleBox, { backgroundColor: colors.accentMuted, borderLeftColor: colors.accent }]}>
                      <Caption color={colors.accent}>{chosenSuggestion.rationale}</Caption>
                    </View>
                  ) : null}

                  {/* Metric type selector */}
                  <Label style={[s.fieldLabel, { marginTop: space.xl, color: colors.textTertiary }]}>METRIC TYPE</Label>
                  <View style={s.metricRow}>
                    {METRIC_OPTIONS.map((opt) => {
                      const selected = metricType === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            s.metricCard,
                            { backgroundColor: selected ? colors.accentMuted : colors.surface, borderColor: selected ? colors.accent : colors.border },
                          ]}
                          onPress={() => { setMetricType(opt.id); setFormError(null); }}
                          activeOpacity={0.75}
                        >
                          <Body style={s.metricIcon}>{opt.icon}</Body>
                          <Small color={selected ? colors.accent : colors.textPrimary} style={s.metricLabel}>
                            {opt.label}
                          </Small>
                          <Caption color={colors.textTertiary} style={s.metricSub} numberOfLines={2}>
                            {opt.sub}
                          </Caption>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Values section */}
                  {metricType !== "boolean" && (
                    <>
                      <View style={s.valuesRow}>
                        <View style={s.flex1}>
                          <Label style={[s.fieldLabel, { color: colors.textTertiary }]}>START</Label>
                          <TextInput
                            style={[s.numericInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                            value={startVal}
                            onChangeText={setStartVal}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.placeholder}
                          />
                        </View>
                        <View style={s.valueGap} />
                        <View style={s.flex1}>
                          <Label style={[s.fieldLabel, { color: colors.textTertiary }]}>TARGET</Label>
                          <TextInput
                            style={[s.numericInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                            value={targetVal}
                            onChangeText={(v) => { setTargetVal(v); setFormError(null); }}
                            keyboardType="numeric"
                            placeholder="100"
                            placeholderTextColor={colors.placeholder}
                          />
                        </View>
                      </View>
                      <Label style={[s.fieldLabel, { marginTop: space.lg, color: colors.textTertiary }]}>UNIT</Label>
                      <TextInput
                        style={[s.unitInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="km, hrs, $, pages…"
                        placeholderTextColor={colors.placeholder}
                      />
                    </>
                  )}

                  {/* Timeline */}
                  <Label style={[s.fieldLabel, { marginTop: space.xl, color: colors.textTertiary }]}>DUE DATE</Label>
                  <View style={s.dueDateRow}>
                    {[
                      { label: "This week", value: endOfWeek() },
                      { label: "This month", value: endOfMonth() },
                      { label: "This quarter", value: endOfQuarter() },
                      { label: "None", value: null },
                    ].map((opt) => {
                      const selected = dueDate === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[
                            s.dueDateChip,
                            { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentMuted : colors.surface },
                          ]}
                          onPress={() => setDueDate(opt.value)}
                          activeOpacity={0.75}
                        >
                          <Caption color={selected ? colors.accent : colors.textSecondary}>{opt.label}</Caption>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Error */}
                  {formError ? (
                    <View style={[s.errorBox, { backgroundColor: colors.errorSoft }]}>
                      <Caption color={colors.error}>{formError}</Caption>
                    </View>
                  ) : null}

                  {/* Submit */}
                  <Button
                    title={submitting ? "Adding…" : "Add Key Result"}
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleSubmit}
                    disabled={submitting}
                    loading={submitting}
                    style={s.submitBtn}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles (no colors — all color-dependent styles are inline above) ─────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: space.lg,
  },
  scrollContent: {
    paddingBottom: space.lg,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.xl,
  },
  closeBtn: {
    padding: space.xs,
  },
  backBtn: {
    padding: space.xs,
  },
  flex1: {
    flex: 1,
  },

  sheetTitle: {
    marginBottom: space.sm,
  },
  sheetSubtitle: {
    marginBottom: space.xl,
  },

  suggestionCard: {
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: 1,
  },
  suggestionCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.sm,
    marginBottom: space.sm,
  },
  suggestionTitle: {
    flex: 1,
    lineHeight: 22,
  },
  suggestionMeta: {
    alignItems: "flex-end",
    gap: space.xs,
  },
  metricBadge: {
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  suggestionRationale: {
    lineHeight: 18,
  },

  skeletonCard: {
    height: 88,
    borderRadius: radius.md,
    marginBottom: space.md,
  },

  scratchLink: {
    alignItems: "center",
    paddingVertical: space.xl,
  },

  fieldLabel: {
    marginBottom: space.sm,
    letterSpacing: 0.8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 56,
  },
  rationaleBox: {
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.sm,
    borderLeftWidth: 2,
  },

  metricRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: "center",
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: space.xs,
  },
  metricLabel: {
    fontWeight: "600",
    marginBottom: space.xxs,
    textAlign: "center",
  },
  metricSub: {
    textAlign: "center",
    lineHeight: 14,
  },

  valuesRow: {
    flexDirection: "row",
    marginTop: space.xl,
  },
  valueGap: {
    width: space.md,
  },
  numericInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  unitInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: 15,
  },

  dueDateRow: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
  },
  dueDateChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  errorBox: {
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.lg,
  },

  submitBtn: {
    marginTop: space.xl,
  },
});
