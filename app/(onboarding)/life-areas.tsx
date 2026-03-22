// Migration required: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_life_areas jsonb DEFAULT '[]';

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { impactLight, notifySuccess } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { getFriendlyErrorMessage } from "../../lib/errors";
import { space, radius, useTheme } from "../../constants/theme";
import { Headline, Body, BodyMedium, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import Button from "../../components/Button";

const LIFE_AREAS = [
  { id: "career", label: "Career", emoji: "💼" },
  { id: "health", label: "Health", emoji: "💪" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "relationships", label: "Relationships", emoji: "❤️" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { id: "creativity", label: "Creativity", emoji: "🎨" },
  { id: "other", label: "Other", emoji: "⭐" },
] as const;

export default function LifeAreasScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, setProfile, profile } = useAuthStore();
  const { colors, isDark } = useTheme();

  function toggleArea(id: string) {
    setError(null);
    impactLight();
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleConfirm() {
    if (selected.length === 0) {
      setError("Pick at least one area to continue.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ preferred_life_areas: selected, onboarding_completed: true })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (updatedProfile) setProfile({ ...profile!, ...updatedProfile });

      notifySuccess();
      router.replace("/(tabs)");
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, "Could not save your choices. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const rows: (typeof LIFE_AREAS[number])[][] = [];
  for (let i = 0; i < LIFE_AREAS.length; i += 2) {
    rows.push([LIFE_AREAS[i], LIFE_AREAS[i + 1]].filter(Boolean) as typeof LIFE_AREAS[number][]);
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + space.xxl }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Headline style={styles.title}>What areas of life{"\n"}matter most to you?</Headline>
        <Body color={colors.textSecondary}>
          Select everything that feels relevant right now. You can update this anytime.
        </Body>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((area) => {
              const isSelected = selected.includes(area.id);
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => toggleArea(area.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cardEmoji}>{area.emoji}</Text>
                  <BodyMedium color={isSelected ? colors.textPrimary : colors.textSecondary}>
                    {area.label}
                  </BodyMedium>
                  {isSelected && (
                    <View style={[styles.checkDot, { backgroundColor: colors.accent }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
            <Caption color={colors.error}>{error}</Caption>
          </View>
        ) : null}

        <Button
          title={
            submitting
              ? "Saving..."
              : selected.length > 0
              ? `Start My Journey (${selected.length} selected)`
              : "Start My Journey"
          }
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.xxl,
    marginBottom: space.xxl,
  },
  title: {
    lineHeight: 36,
    marginBottom: space.sm,
  },
  grid: {
    paddingHorizontal: space.xxl,
    paddingBottom: space.lg,
    gap: space.md,
  },
  row: {
    flexDirection: "row",
    gap: space.md,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: space.xl,
    alignItems: "flex-start",
    minHeight: 100,
    position: "relative",
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: space.sm,
  },
  checkDot: {
    position: "absolute",
    top: space.md,
    right: space.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: space.xxl,
    paddingBottom: space.huge,
    paddingTop: space.sm,
  },
  errorBox: {
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
});
