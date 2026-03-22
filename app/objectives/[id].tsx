import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { impactMedium, notifySuccess } from "../../lib/haptics";
import { useAuthStore } from "../../stores/authStore";
import {
  getObjectiveById,
  createKeyResult,
  updateKeyResultProgress,
  deleteObjective,
  calcKrProgress,
  LIFE_AREA_MAP,
  type Objective,
  type KeyResult,
} from "../../lib/queries";
import { getFriendlyErrorMessage } from "../../lib/errors";
import { space, radius, anim, useTheme } from "../../constants/theme";
import { Headline, Title2, Title3, Body, BodyMedium, Label, Caption, Small } from "../../components/Typography";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ProgressBar from "../../components/ProgressBar";
import BottomSheet from "../../components/BottomSheet";
import EmptyState from "../../components/EmptyState";
import Input from "../../components/Input";
import AddKrSheet from "../../components/AddKrSheet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

const METRIC_LABELS: Record<string, string> = {
  number: "Number",
  percentage: "%",
  boolean: "Done",
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ─── KR Card ──────────────────────────────────────────────────────────────────

function KrCard({ kr, onUpdate }: { kr: KeyResult; onUpdate: () => void }) {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState(String(kr.current_value));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pct = calcKrProgress(kr);
  const unitStr = kr.unit ? ` ${kr.unit}` : "";
  const progressLabel =
    kr.metric_type === "boolean"
      ? kr.current_value >= 1 ? "Done ✓" : "Not done"
      : `${kr.current_value}${unitStr} / ${kr.target_value}${unitStr}`;

  async function handleSave() {
    if (!user) return;
    const val = kr.metric_type === "boolean"
      ? parseFloat(inputValue) >= 1 ? 1 : 0
      : parseFloat(inputValue);

    if (isNaN(val)) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateKeyResultProgress(kr.id, val, user.id, kr.objective_id);
      notifySuccess();
      setModalVisible(false);
      onUpdate();
    } catch (err) {
      setSaveError(getFriendlyErrorMessage(err, "Failed to save progress. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card elevation="sm" style={s.krCard}>
        <View style={s.krCardHeader}>
          <Chip variant="badge" label={METRIC_LABELS[kr.metric_type]} />
          <Button
            title="Update"
            variant="secondary"
            size="sm"
            onPress={() => {
              setInputValue(String(kr.current_value));
              setSaveError(null);
              setModalVisible(true);
            }}
          />
        </View>

        <BodyMedium style={s.krTitle}>{kr.title}</BodyMedium>

        <ProgressBar progress={pct} animated />

        <View style={s.krCardFooter}>
          <Caption>{progressLabel}</Caption>
          {kr.due_date && (
            <Chip variant="badge" label={`Due ${formatDate(kr.due_date)}`} />
          )}
        </View>
      </Card>

      {/* Update progress bottom sheet */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Update Progress"
      >
        <Body color={colors.textSecondary} style={s.sheetKrTitle} numberOfLines={2}>
          {kr.title}
        </Body>

        {kr.metric_type === "boolean" ? (
          <View style={s.boolRow}>
            {[{ label: "Not done", val: "0" }, { label: "Done ✓", val: "1" }].map((opt) => (
              <Chip
                key={opt.val}
                variant="filter"
                label={opt.label}
                selected={inputValue === opt.val}
                onPress={() => setInputValue(opt.val)}
                style={s.boolChip}
              />
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              s.sheetNumericInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.accent,
                color: colors.textPrimary,
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            placeholder={`Current: ${kr.current_value}${unitStr}`}
            placeholderTextColor={colors.placeholder}
            autoFocus
            selectTextOnFocus
          />
        )}

        {saveError ? (
          <View style={[s.errorBox, { backgroundColor: colors.errorSoft }]}>
            <Caption color={colors.error}>{saveError}</Caption>
          </View>
        ) : null}

        <Button
          title={saving ? "Saving…" : "Save Progress"}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={saving}
          loading={saving}
        />
      </BottomSheet>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ObjectiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const userId = user?.id;
  const insets = useSafeAreaInsets(); // must be before any early returns
  const { colors, isDark } = useTheme();

  const [showKrSheet, setShowKrSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    data: objective,
    isLoading: loading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["objective", id, userId],
    queryFn: () => getObjectiveById(id!, userId!),
    enabled: !!id && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const load = useCallback(() => {
    refetch();
    // Also bust the shared objectives list so Home / Insights / Objectives tabs reflect the update
    void queryClient.invalidateQueries({ queryKey: ["objectives", userId] });
  }, [refetch, queryClient, userId]);

  async function handleDelete() {
    Alert.alert(
      "Delete Objective",
      "This will permanently delete this objective and all its key results. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id || !user) return;
            impactMedium();
            setDeleting(true);
            try {
              await deleteObjective(id, user.id);
              await queryClient.invalidateQueries({ queryKey: ["objectives", userId] });
              router.back();
            } catch {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || !objective) {
    return (
      <View style={[s.centered, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <Body color={colors.textSecondary}>
          {isError ? "Could not load objective." : "Objective not found."}
        </Body>
        {isError && (
          <TouchableOpacity onPress={() => refetch()} style={s.retryLink}>
            <Body color={colors.accent}>Retry</Body>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.back()} style={s.retryLink}>
          <Body color={colors.accent}>Go back</Body>
        </TouchableOpacity>
      </View>
    );
  }

  const area = LIFE_AREA_MAP[objective.life_area];
  const keyResults = objective.key_results ?? [];
  const progress = Math.round(objective.progress ?? 0);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[s.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.massive + space.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <BodyMedium color={colors.accent}>Back</BodyMedium>
        </TouchableOpacity>
      </View>

      {/* Title + meta */}
      <Headline style={s.title}>{objective.title}</Headline>

      <View style={s.metaRow}>
        <Chip
          variant="area"
          emoji={area?.emoji ?? "⭐"}
          label={area?.label ?? objective.life_area}
        />
        <Chip
          variant="badge"
          label={CADENCE_LABELS[objective.cadence] ?? objective.cadence}
        />
        <BodyMedium color={colors.accent} style={s.progressPct}>{progress}%</BodyMedium>
      </View>

      {/* Progress bar */}
      <View style={s.progressBarWrap}>
        <ProgressBar progress={progress} height={8} animated />
      </View>

      {/* Description */}
      {objective.description ? (
        <Body color={colors.textSecondary} style={s.description}>{objective.description}</Body>
      ) : null}

      {/* Key Results */}
      <View style={s.krHeader}>
        <Title2>Key Results</Title2>
        <Button
          title="+ Add KR"
          variant="secondary"
          size="sm"
          onPress={() => setShowKrSheet(true)}
        />
      </View>

      <AddKrSheet
        visible={showKrSheet}
        onClose={() => setShowKrSheet(false)}
        objectiveId={objective.id}
        objectiveTitle={objective.title}
        lifeArea={objective.life_area}
        objectiveDescription={objective.description}
        userId={user!.id}
        userName={profile?.full_name?.split(" ")[0]}
        onAdded={() => {
          setShowKrSheet(false);
          load();
        }}
      />

      {keyResults.length === 0 ? (
        <EmptyState
          message="No key results yet. Add one to start tracking progress."
        />
      ) : (
        keyResults.map((kr) => (
          <KrCard key={kr.id} kr={kr} onUpdate={load} />
        ))
      )}

      {/* Delete */}
      <Button
        title={deleting ? "Deleting…" : "Delete Objective"}
        variant="destructive"
        onPress={handleDelete}
        disabled={deleting}
        loading={deleting}
        fullWidth
        style={s.deleteBtn}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  retryLink: {
    marginTop: space.md,
  },

  // Header
  header: {
    marginBottom: space.xl,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },

  // Title
  title: {
    marginBottom: space.md,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexWrap: "wrap",
  },
  progressPct: {
    marginLeft: "auto",
  },

  // Progress bar
  progressBarWrap: {
    marginTop: space.lg,
    marginBottom: space.sm,
  },

  // Description
  description: {
    marginTop: space.lg,
    marginBottom: space.xs,
  },

  // KR section header
  krHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.xxxl,
    marginBottom: space.xs,
  },

  // Error box (used by KrCard update sheet)
  errorBox: {
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },

  // KR Card
  krCard: {
    marginBottom: space.md,
  },
  krCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  krTitle: {
    marginBottom: space.md,
    lineHeight: 21,
  },
  krCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.sm,
  },

  // Bottom sheet content
  sheetKrTitle: {
    marginBottom: space.xl,
    lineHeight: 20,
  },
  sheetNumericInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontSize: 20,
    textAlign: "center",
    marginBottom: space.xl,
    fontWeight: "700",
  },
  boolRow: {
    flexDirection: "row",
    gap: space.md,
    marginBottom: space.xl,
  },
  boolChip: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 14,
  },

  // Delete
  deleteBtn: {
    marginTop: space.huge,
  },
});
