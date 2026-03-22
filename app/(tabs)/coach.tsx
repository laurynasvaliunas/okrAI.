import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { impactLight } from "../../lib/haptics";
import { useAuthStore } from "../../stores/authStore";
import {
  getCoachingHistory,
  saveCoachingSession,
  getObjectives,
  getLatestWeeklyCheckIn,
  calcObjectiveProgress,
} from "../../lib/queries";
import { getMessageFromFunctionsHttpError } from "../../lib/functionsErrors";
import { invokePersonalCoach } from "../../lib/personalCoachInvoke";
import { space, radius, useTheme } from "../../constants/theme";
import { BodyMedium, Body, Caption } from "../../components/Typography";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
};

const SUGGESTIONS = [
  "Review my progress this week",
  "Help me write a new objective",
  "I'm struggling with a goal",
];

// ─── Coach Avatar ──────────────────────────────────────────────────────────────

function CoachAvatar({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.coachAvatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <Ionicons name="sparkles" size={size * 0.45} color={colors.accent} />
    </View>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

const Bubble = React.memo(function Bubble({ message }: { message: ChatMessage }) {
  const { colors, shadows } = useTheme();
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowCoach]}>
      {!isUser && (
        <View style={styles.coachAvatarWrap}>
          <CoachAvatar size={28} />
        </View>
      )}
      {isUser ? (
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.accent,
              borderBottomRightRadius: 6,
            },
            shadows.sm,
          ]}
        >
          <Body style={{ color: colors.accentForeground }}>{message.text}</Body>
        </View>
      ) : (
        <Card
          elevation="sm"
          style={{
            borderRadius: 18,
            borderBottomLeftRadius: 6,
            padding: 0,
            paddingHorizontal: space.md + 2,
            paddingVertical: space.md - 2,
            maxWidth: "80%",
          }}
        >
          <Body>{message.text}</Body>
        </Card>
      )}
    </View>
  );
});

function SuggestionChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <View style={styles.chipsContainer}>
      {SUGGESTIONS.map((s) => (
        <Chip
          key={s}
          label={s}
          variant="filter"
          onPress={() => onSelect(s)}
          style={{ alignSelf: "flex-start" }}
        />
      ))}
    </View>
  );
}

function LoadingBubble() {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makePulse = (val: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1.0, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    const a1 = makePulse(dot1);
    const a2 = makePulse(dot2);
    const a3 = makePulse(dot3);
    a1.start();
    setTimeout(() => a2.start(), 150);
    setTimeout(() => a3.start(), 300);

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowCoach]}>
      <View style={styles.coachAvatarWrap}>
        <CoachAvatar size={28} />
      </View>
      <Card
        elevation="sm"
        style={{
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          padding: 0,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          flexDirection: "row",
          alignItems: "center",
          gap: space.xs,
        }}
      >
        {[dot1, dot2, dot3].map((opacity, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { opacity, backgroundColor: colors.accent }]}
          />
        ))}
      </Card>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CoachScreen() {
  const { colors, shadows, isDark } = useTheme();
  const { user, profile } = useAuthStore();
  const userId = user?.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const userChattedRef = React.useRef(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // Fetch objectives for context bar
  const { data: objectivesData } = useQuery({
    queryKey: ["objectives", userId],
    queryFn: () => getObjectives(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const activeObjectives = useMemo(() => {
    return (objectivesData ?? []).filter((o) => o.status === "active");
  }, [objectivesData]);

  const avgProgress = useMemo(() => {
    if (activeObjectives.length === 0) return 0;
    return Math.round(
      activeObjectives.reduce((s, o) => s + calcObjectiveProgress(o.key_results ?? []), 0) /
        activeObjectives.length
    );
  }, [activeObjectives]);

  const welcomeMessage = useMemo<ChatMessage>(
    () => ({
      id: "welcome",
      role: "coach",
      text: `Hi ${firstName}! I'm here to help you achieve your goals. How are you feeling about your progress this week?`,
    }),
    [firstName]
  );

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["coachingHistory", userId],
    queryFn: () =>
      Promise.race([
        getCoachingHistory(userId!),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out.")), 8000)
        ),
      ]),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });

  const displayMessages = useMemo(() => {
    if (isHistoryError && messages.length === 0) return [];
    if (isHistoryLoading && messages.length === 0) return [welcomeMessage];
    return messages;
  }, [isHistoryError, isHistoryLoading, messages, welcomeMessage]);

  useEffect(() => {
    if (!userId || isHistoryLoading || isHistoryError || userChattedRef.current) return;
    if (history.length === 0) {
      setMessages([welcomeMessage]);
    } else {
      const mapped: ChatMessage[] = [];
      history.forEach((session) => {
        mapped.push({ id: `${session.id}-user`, role: "user", text: session.input_text });
        if (session.coaching_response?.message) {
          mapped.push({ id: `${session.id}-coach`, role: "coach", text: session.coaching_response.message });
        }
      });
      setMessages(mapped);
    }
  }, [userId, isHistoryLoading, isHistoryError, history, welcomeMessage]);

  const buildContext = useCallback(async (): Promise<string> => {
    if (!user) return "";
    try {
      const [objectives, latestCheckIn] = await Promise.all([
        getObjectives(user.id),
        getLatestWeeklyCheckIn(user.id),
      ]);

      const parts: string[] = [];
      const active = objectives.filter((o) => o.status === "active");
      if (active.length > 0) {
        parts.push(
          "Active objectives:\n" +
            active.map((o) => {
              const krCount = o.key_results?.length ?? 0;
              return `- ${o.title} (${Math.round(o.progress ?? 0)}%${krCount > 0 ? `, ${krCount} key result${krCount !== 1 ? "s" : ""}` : ""})`;
            }).join("\n")
        );
      }

      if (latestCheckIn?.input_text) {
        const createdAt = new Date(latestCheckIn.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        parts.push(`Latest weekly check-in (${createdAt}):\n${latestCheckIn.input_text}`);
        if (latestCheckIn.coaching_response?.message) {
          parts.push(`Coach reflection from that check-in: "${latestCheckIn.coaching_response.message}"`);
        }
      }

      return parts.join("\n\n");
    } catch {
      return "";
    }
  }, [user]);

  async function handleSend(overrideText?: string) {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if (!text || isSending || !user) return;

    userChattedRef.current = true;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: "user", text };
    const priorForModel = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));

    setMessages((prev) => {
      const base = prev.length > 0 ? prev : [welcomeMessage];
      return [...base, userMsg];
    });
    setInput("");
    setIsSending(true);

    try {
      const context = await buildContext();
      const fn = profile?.full_name?.split(" ")[0];

      const { data, error } = await Promise.race([
        invokePersonalCoach({ message: text, userId: user.id, context, userName: fn, conversation: priorForModel }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Coach took too long. Check your connection or sign out and back in, then try again.")), 60_000)
        ),
      ]);

      if (error) {
        const fromResponse = await getMessageFromFunctionsHttpError(error);
        const body = data as { error?: string; message?: string } | undefined;
        const detail = fromResponse ?? body?.error ?? (typeof error === "object" && error !== null && "message" in error ? String((error as { message: string }).message) : null);
        throw new Error(detail || "Coach request failed");
      }

      const payload = data as { message?: string; error?: string } | undefined;
      if (payload?.error && !payload?.message) throw new Error(payload.error);

      const responseText = payload?.message ?? "Sorry, I couldn't generate a response. Please try again.";
      const coachMsg: ChatMessage = { id: `coach-${Date.now()}`, role: "coach", text: responseText };
      setMessages((prev) => [...prev, coachMsg]);

      saveCoachingSession({ user_id: user.id, entity_id: user.id, input_text: text, coaching_response: { message: responseText } }).catch(() => {});
    } catch (err) {
      let msg = err instanceof Error && err.message && err.message !== "Coach request failed"
        ? err.message
        : "Sorry, something went wrong. Please try again.";
      if (msg === "Edge Function returned a non-2xx status code") {
        msg = "Coach is unavailable. Check that the Edge Function is deployed and ANTHROPIC_API_KEY is set.";
      }
      if (msg === "Invalid JWT" || msg.toLowerCase().includes("invalid jwt") || msg.toLowerCase().includes("jwt expired")) {
        msg = "Your session has expired. Please sign out from the Profile tab and sign back in.";
      }
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "coach", text: msg.length > 420 ? `${msg.slice(0, 417)}…` : msg }]);
    } finally {
      setIsSending(false);
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, shadows.sm, { paddingTop: insets.top + space.lg, backgroundColor: colors.bg }]}>
        <View style={styles.headerRow}>
          <CoachAvatar size={44} />
          <View style={styles.headerText}>
            <BodyMedium style={styles.headerTitle}>AI Coach</BodyMedium>
            <Caption color={colors.textSecondary}>Here to help you stay on track</Caption>
          </View>
        </View>

        {/* Context bar */}
        {activeObjectives.length > 0 && (
          <View style={[styles.contextBar, { borderTopColor: colors.border }]}>
            <Caption color={colors.textTertiary} style={styles.contextLabel}>CURRENT CONTEXT</Caption>
            <Caption color={colors.textSecondary}>
              {activeObjectives.length} active goal{activeObjectives.length !== 1 ? "s" : ""}
              {"  ·  "}
              {avgProgress}% avg progress
            </Caption>
          </View>
        )}
      </View>

      {/* ── Messages ────────────────────────────────────────── */}
      {isHistoryError && messages.length === 0 ? (
        <View style={styles.historyError}>
          <EmptyState message="Could not load chat history." actionLabel="Retry" onAction={() => refetchHistory()} />
        </View>
      ) : (
        <FlatList
          data={[...displayMessages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Bubble message={item} />}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isSending
              ? <LoadingBubble />
              : (!isHistoryError && displayMessages.length === 1 && displayMessages[0].id === "welcome"
                  ? <SuggestionChips onSelect={handleSend} />
                  : null)
          }
        />
      )}

      {/* ── Input bar ───────────────────────────────────────── */}
      <View style={[styles.inputBar, shadows.md, { paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Share a goal, tension, or question…"
          placeholderTextColor={colors.placeholder}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.accent }, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={() => { impactLight(); handleSend(); }}
          disabled={!input.trim() || isSending}
          activeOpacity={0.8}
          accessibilityLabel="Send message to coach"
        >
          <Ionicons name="arrow-up" size={20} color={colors.accentForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: space.xl,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingBottom: space.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  coachAvatarCircle: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Context bar
  contextBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
    gap: space.xxs,
  },
  contextLabel: {
    letterSpacing: 1,
  },

  // Messages
  messageList: { flex: 1 },
  messageListContent: {
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
    gap: space.md,
  },
  historyError: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },

  // Bubbles
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    marginBottom: space.xs,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowCoach: { justifyContent: "flex-start" },
  coachAvatarWrap: {
    marginBottom: space.xxs,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md - 2,
    borderRadius: 18,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Suggestion chips
  chipsContainer: {
    marginTop: space.xs,
    marginLeft: space.xxxl + space.xs,
    gap: space.sm,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.md - 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  input: {
    flex: 1,
    borderRadius: radius.xl - 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.md - 2,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: space.huge,
    height: space.huge,
    borderRadius: space.xl,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.35 },
});
