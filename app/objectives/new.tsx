import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { notifySuccess } from "../../lib/haptics";
import { useAuthStore } from "../../stores/authStore";
import { createObjective, LIFE_AREA_MAP, ALL_LIFE_AREAS } from "../../lib/queries";
import { getFriendlyErrorMessage } from "../../lib/errors";
import { supabase } from "../../lib/supabase";
import { space, radius, useTheme } from "../../constants/theme";
import { Title3, BodyMedium, Body, Label, Caption } from "../../components/Typography";
import Input from "../../components/Input";
import Chip from "../../components/Chip";
import Button from "../../components/Button";

function localHint(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("run") || t.includes("km") || t.includes("marathon")) return "Tip: add a specific distance and timeframe.";
  if (t.includes("read") || t.includes("book")) return "Tip: set a number of books or pages as your key result.";
  if (t.includes("save") || t.includes("money") || t.includes("€") || t.includes("$")) return "Tip: specify a target amount to save.";
  if (t.includes("learn") || t.includes("course") || t.includes("skill")) return "Tip: define what 'learned' means — a certificate, project, or practice hours.";
  if (t.includes("meditat") || t.includes("mindful")) return "Tip: track sessions per week for consistency.";
  if (t.includes("sleep")) return "Tip: set a target average hours of sleep per night.";
  if (t.includes("weight") || t.includes("gym") || t.includes("workout")) return "Tip: track sessions completed, not just weight — process beats outcome.";
  return "Tip: make it specific and measurable — what does success look like?";
}

const CADENCES = [
  { id: "weekly" as const, label: "Weekly" },
  { id: "monthly" as const, label: "Monthly" },
  { id: "quarterly" as const, label: "Quarterly" },
];

export default function NewObjectiveScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const userId = user?.id;
  const { colors, isDark, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<string>("");
  const [cadence, setCadence] = useState<"weekly" | "monthly" | "quarterly">("quarterly");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  // Show user's preferred areas first, then remaining ones
  const preferred = profile?.preferred_life_areas ?? [];
  const remaining = ALL_LIFE_AREAS.filter((a) => !preferred.includes(a));
  const orderedAreas = [...preferred, ...remaining];

  // Build 2-row grid of 4 (all 8 areas)
  const areaRows: string[][] = [];
  for (let i = 0; i < orderedAreas.length; i += 4) {
    areaRows.push(orderedAreas.slice(i, i + 4));
  }

  // AI title hint — debounced 800ms
  useEffect(() => {
    if (title.length < 2) { setAiHint(null); return; }

    const timerId = setTimeout(async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("personal-coach", {
          body: { hint: true, message: title, userId: user?.id ?? "", context: "", userName: profile?.full_name, conversation: [] },
        });
        if (!fnError && data?.reply) {
          setAiHint(data.reply as string);
        } else {
          setAiHint(localHint(title));
        }
      } catch {
        setAiHint(localHint(title));
      }
    }, 800);

    return () => clearTimeout(timerId);
  }, [title]);

  async function handleCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a title for your objective.");
      return;
    }
    if (!lifeArea) {
      setError("Please select a life area.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      await createObjective(
        {
          title: title.trim(),
          life_area: lifeArea,
          cadence,
          description: description.trim() || undefined,
        },
        user.id
      );
      await queryClient.invalidateQueries({ queryKey: ["objectives", userId] });
      notifySuccess();
      router.back();
    } catch (err: unknown) {
      console.error("[NewObjective] createObjective failed:", JSON.stringify(err, null, 2), err);
      setError(getFriendlyErrorMessage(err, "Failed to create objective. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.lg }, shadows.sm]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <BodyMedium color={colors.accent}>Back</BodyMedium>
        </TouchableOpacity>
        <Title3>New Goal</Title3>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.section}>
          <Input
            label="TITLE"
            placeholder="e.g. Run a half marathon"
            value={title}
            onChangeText={(v) => { setTitle(v); setError(null); }}
            autoFocus
          />
          {aiHint ? (
            <View style={[styles.hintBox, { backgroundColor: colors.accentMuted, borderLeftColor: colors.accent }]}>
              <Caption color={colors.accent}>{aiHint}</Caption>
            </View>
          ) : null}
        </View>

        {/* Life area */}
        <View style={styles.section}>
          <Label style={styles.sectionLabel}>LIFE AREA</Label>
          <View style={styles.areaGrid}>
            {areaRows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.areaRow}>
                {row.map((areaId) => {
                  const area = LIFE_AREA_MAP[areaId];
                  const isSelected = lifeArea === areaId;
                  const isPreferred = preferred.includes(areaId);
                  return (
                    <Chip
                      key={areaId}
                      variant="area"
                      emoji={area.emoji}
                      label={area.label}
                      selected={isSelected}
                      onPress={() => { setLifeArea(areaId); setError(null); }}
                      style={[styles.areaChip, !isPreferred && styles.pillDim]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Cadence */}
        <View style={styles.section}>
          <Label style={styles.sectionLabel}>CADENCE</Label>
          <View style={styles.cadenceRow}>
            {CADENCES.map((c) => (
              <Chip
                key={c.id}
                variant="filter"
                label={c.label}
                selected={cadence === c.id}
                onPress={() => setCadence(c.id)}
              />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Input
            label="DESCRIPTION (OPTIONAL)"
            placeholder="What does success look like?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg, backgroundColor: colors.bg }]}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
            <Caption color={colors.error}>{error}</Caption>
          </View>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          title={submitting ? "Creating..." : "Create Goal"}
          loading={submitting}
          onPress={handleCreate}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  backBtn: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },

  // Form
  form: {
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  section: {
    marginBottom: space.xxl,
  },
  sectionLabel: {
    marginBottom: space.sm,
  },

  // Life area grid — 2 rows of 4
  areaGrid: {
    gap: space.sm,
  },
  areaRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  areaChip: {
    flex: 1,
    justifyContent: "center",
  },
  pillDim: {
    opacity: 0.6,
  },

  // AI hint
  hintBox: {
    marginTop: space.sm,
    borderLeftWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },

  // Cadence pills
  cadenceRow: {
    flexDirection: "row",
    gap: space.sm,
  },

  // Error
  errorBox: {
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    marginBottom: space.sm,
  },
});
