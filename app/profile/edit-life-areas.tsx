import { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { getFriendlyErrorMessage } from "../../lib/errors";
import { refreshSessionWithTimeout } from "../../lib/sessionRefresh";
import { space, radius, useTheme } from "../../constants/theme";
import { Title3, Body, BodyMedium, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import { impactLight, notifySuccess } from "../../lib/haptics";

const LIFE_AREAS = [
  { id: "career", label: "Career", emoji: "\u{1F4BC}" },
  { id: "health", label: "Health", emoji: "\u{1F4AA}" },
  { id: "finance", label: "Finance", emoji: "\u{1F4B0}" },
  { id: "relationships", label: "Relationships", emoji: "\u{2764}\u{FE0F}" },
  { id: "learning", label: "Learning", emoji: "\u{1F4DA}" },
  { id: "mindfulness", label: "Mindfulness", emoji: "\u{1F9D8}" },
  { id: "creativity", label: "Creativity", emoji: "\u{1F3A8}" },
  { id: "other", label: "Other", emoji: "\u{2B50}" },
] as const;

export default function EditLifeAreasScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const { colors, isDark, shadows } = useTheme();

  const [selected, setSelected] = useState<string[]>(
    profile?.preferred_life_areas ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.preferred_life_areas?.length) {
      setSelected(profile.preferred_life_areas);
    }
  }, [profile?.preferred_life_areas]);

  function toggleArea(id: string) {
    setError(null);
    impactLight();
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Select at least one area.");
      return;
    }
    if (!user) {
      setError("You must be signed in.");
      return;
    }
    if (!profile) {
      setError("Profile is still loading. Try again in a moment.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await refreshSessionWithTimeout(5000);

      const { data: updatedProfile, error: updateError } = await Promise.race([
        supabase
          .from("profiles")
          .update({ preferred_life_areas: selected })
          .eq("id", user.id)
          .select()
          .single(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timed out. Check connection and try again.")),
            20000
          )
        ),
      ]);

      if (updateError) throw updateError;
      if (updatedProfile) setProfile({ ...profile, ...updatedProfile });

      notifySuccess();
      router.back();
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, "Could not save changes. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const rows: (typeof LIFE_AREAS[number])[][] = [];
  for (let i = 0; i < LIFE_AREAS.length; i += 2) {
    rows.push(
      [LIFE_AREAS[i], LIFE_AREAS[i + 1]].filter(Boolean) as typeof LIFE_AREAS[number][]
    );
  }

  const insets = useSafeAreaInsets();

  if (user && !profile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg, paddingTop: insets.top + 24, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <ActivityIndicator color={colors.accent} size="large" />
        <Body color={colors.textSecondary} style={{ marginTop: space.md }}>
          Loading profile...
        </Body>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 24 }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, shadows.sm]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <BodyMedium color={colors.accent}>Back</BodyMedium>
        </TouchableOpacity>
        <Title3>Edit Life Areas</Title3>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.subheader}>
        <Body color={colors.textSecondary}>
          Update the areas you want to focus on. Changes apply immediately.
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
                  style={{ flex: 1 }}
                  onPress={() => toggleArea(area.id)}
                  activeOpacity={0.75}
                >
                  <Card
                    elevation="sm"
                    style={{
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: isSelected ? colors.accent : "transparent",
                      backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                      padding: space.lg,
                      alignItems: "flex-start" as const,
                      minHeight: 100,
                      position: "relative" as const,
                    }}
                  >
                    <BodyMedium style={{ fontSize: 28, marginBottom: space.sm }}>
                      {area.emoji}
                    </BodyMedium>
                    <BodyMedium color={isSelected ? colors.textPrimary : colors.textSecondary}>
                      {area.label}
                    </BodyMedium>
                    {isSelected && (
                      <View style={[styles.checkDot, { backgroundColor: colors.accent }]} />
                    )}
                  </Card>
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
          variant="primary"
          size="lg"
          fullWidth
          title={submitting ? "Saving..." : "Save Changes"}
          loading={submitting}
          onPress={handleSave}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    gap: space.xs,
  },
  subheader: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },

  // Grid
  grid: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
  },
  row: {
    flexDirection: "row",
    gap: space.sm,
  },
  checkDot: {
    position: "absolute",
    top: space.sm,
    right: space.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    paddingTop: space.sm,
  },
  errorBox: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
});
