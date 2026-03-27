import { supabase } from "./supabase";
import type { KeyResultRow, ObjectiveRow, CheckInRow, CoachingSessionRow } from "../types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KeyResult = KeyResultRow;
export type Objective = ObjectiveRow & { key_results?: KeyResult[] };
export type CheckIn = CheckInRow;

// ─── Life area metadata ────────────────────────────────────────────────────────

export const LIFE_AREA_MAP: Record<string, { label: string; emoji: string }> = {
  career:        { label: "Career",        emoji: "💼" },
  health:        { label: "Health",        emoji: "💪" },
  finance:       { label: "Finance",       emoji: "💰" },
  relationships: { label: "Relationships", emoji: "❤️" },
  learning:      { label: "Learning",      emoji: "📚" },
  mindfulness:   { label: "Mindfulness",   emoji: "🧘" },
  creativity:    { label: "Creativity",    emoji: "🎨" },
  other:         { label: "Other",         emoji: "⭐" },
};

export const ALL_LIFE_AREAS = Object.keys(LIFE_AREA_MAP) as (keyof typeof LIFE_AREA_MAP)[];

// ─── Progress helpers ──────────────────────────────────────────────────────────

export function calcKrProgress(kr: KeyResult): number {
  if (kr.metric_type === "boolean") {
    return kr.current_value >= 1 ? 100 : 0;
  }
  const range = kr.target_value - kr.start_value;
  if (range === 0) return 100;
  const pct = ((kr.current_value - kr.start_value) / range) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function calcObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;
  const total = keyResults.reduce((sum, kr) => sum + calcKrProgress(kr), 0);
  return Math.round(total / keyResults.length);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Personal objectives for this user — fetches objectives and key_results separately
 *  to avoid PostgREST embedded-join failures when FK isn't registered in the schema cache. */
export async function getObjectives(userId: string): Promise<Objective[]> {
  const { data: objs, error: objErr } = await supabase
    .from("objectives")
    .select("*")
    .is("organization_id", null)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (objErr) {
    console.error("[getObjectives] objectives fetch error:", JSON.stringify(objErr));
    throw objErr;
  }

  const objectives = (objs ?? []) as Objective[];
  if (objectives.length === 0) return [];

  const ids = objectives.map((o) => o.id);

  const { data: krs, error: krErr } = await supabase
    .from("key_results")
    .select("*")
    .in("objective_id", ids)
    .eq("owner_id", userId);

  if (krErr) {
    // Key results failing shouldn't block showing objectives — log and continue
    console.warn("[getObjectives] key_results fetch warning:", JSON.stringify(krErr));
  }

  const krByObjective = ((krs ?? []) as KeyResult[]).reduce<Record<string, KeyResult[]>>(
    (acc, kr) => {
      (acc[kr.objective_id] ??= []).push(kr);
      return acc;
    },
    {}
  );

  return objectives.map((o) => ({ ...o, key_results: krByObjective[o.id] ?? [] }));
}

export async function getObjectiveById(id: string, userId: string): Promise<Objective | null> {
  const { data, error } = await supabase
    .from("objectives")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("organization_id", null)
    .single();

  if (error) {
    console.error("[getObjectiveById] error:", JSON.stringify(error));
    throw error;
  }

  const objective = data as Objective;

  const { data: krs, error: krErr } = await supabase
    .from("key_results")
    .select("*")
    .eq("objective_id", id)
    .eq("owner_id", userId);

  if (krErr) {
    console.warn("[getObjectiveById] key_results warning:", JSON.stringify(krErr));
  }

  return { ...objective, key_results: (krs ?? []) as KeyResult[] };
}

/** Generate a human-readable time_period string from a cadence and optional date. */
function deriveTimePeriod(cadence: "weekly" | "monthly" | "quarterly", date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  if (cadence === "quarterly") {
    const q = Math.floor(month / 3) + 1;
    return `Q${q} ${year}`;
  }
  if (cadence === "monthly") {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  }
  // weekly — ISO week number
  const startOfYear = new Date(year, 0, 1);
  const weekNo = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `W${weekNo} ${year}`;
}

export async function createObjective(
  payload: {
    title: string;
    life_area: string;
    cadence: "weekly" | "monthly" | "quarterly";
    description?: string;
  },
  userId: string
): Promise<Objective> {
  const insertPayload: Record<string, unknown> = {
    title: payload.title,
    life_area: payload.life_area,
    cadence: payload.cadence,
    time_period: deriveTimePeriod(payload.cadence),
    description: payload.description ?? null,
    owner_id: userId,
    organization_id: null,
    status: "active",
  };

  const { data, error } = await supabase
    .from("objectives")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return data as Objective;
}

export async function createKeyResult(
  payload: {
    objective_id: string;
    title: string;
    metric_type: "number" | "percentage" | "boolean";
    start_value: number;
    target_value: number;
    unit?: string;
    due_date?: string;
  },
  userId: string
): Promise<KeyResult> {
  const { data, error } = await supabase
    .from("key_results")
    .insert({
      objective_id: payload.objective_id,
      title: payload.title,
      metric_type: payload.metric_type,
      start_value: payload.start_value,
      current_value: payload.start_value,
      target_value: payload.target_value,
      unit: payload.unit ?? null,
      due_date: payload.due_date ?? null,
      owner_id: userId,
      organization_id: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as KeyResult;
}

export async function updateKeyResultProgress(
  krId: string,
  value: number,
  userId: string,
  objectiveId: string
): Promise<void> {
  // Update current_value on the KR
  const { error: krError } = await supabase
    .from("key_results")
    .update({ current_value: value })
    .eq("id", krId)
    .eq("owner_id", userId);

  if (krError) throw krError;

  // Record check-in
  const { error: ciError } = await supabase.from("check_ins").insert({
    key_result_id: krId,
    user_id: userId,
    progress_value: value,
  });

  if (ciError) throw ciError;

  // Recompute objective progress from all its KRs
  const { data: krs, error: fetchError } = await supabase
    .from("key_results")
    .select("*")
    .eq("objective_id", objectiveId)
    .eq("owner_id", userId);

  if (fetchError) throw fetchError;

  const newProgress = calcObjectiveProgress((krs ?? []) as KeyResult[]);

  const { error: objError } = await supabase
    .from("objectives")
    .update({ progress: newProgress })
    .eq("id", objectiveId)
    .eq("owner_id", userId);

  if (objError) throw objError;
}

export async function deleteObjective(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("objectives")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId)
    .is("organization_id", null);
  if (error) throw error;
}

// ─── Coaching ─────────────────────────────────────────────────────────────────

export type CoachingSession = CoachingSessionRow;

export async function getCoachingHistory(userId: string): Promise<CoachingSession[]> {
  const { data, error } = await supabase
    .from("ai_coaching_sessions")
    .select("*")
    .is("organization_id", null)
    .eq("user_id", userId)
    .eq("entity_type", "personal_coach")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as CoachingSession[];
}

export async function saveCoachingSession(payload: {
  user_id: string;
  entity_id: string;
  input_text: string;
  coaching_response: { message: string };
}): Promise<void> {
  const { error } = await supabase.from("ai_coaching_sessions").insert({
    user_id: payload.user_id,
    organization_id: null,
    entity_type: "personal_coach",
    entity_id: payload.entity_id,
    input_text: payload.input_text,
    coaching_response: payload.coaching_response,
  });
  if (error) throw error;
}

// ─── Profile stats ────────────────────────────────────────────────────────────

export interface ProfileStats {
  totalObjectives: number;
  completedObjectives: number;
  totalCheckIns: number;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [objectivesRes, krCheckInsRes, weeklyCheckInsRes] = await Promise.all([
    supabase
      .from("objectives")
      .select("status")
      .is("organization_id", null)
      .eq("owner_id", userId),
    // KR progress updates (numeric check-ins)
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    // Weekly reflective check-ins (stored in ai_coaching_sessions)
    supabase
      .from("ai_coaching_sessions")
      .select("id", { count: "exact", head: true })
      .is("organization_id", null)
      .eq("user_id", userId)
      .eq("entity_type", "weekly_checkin"),
  ]);

  if (objectivesRes.error) throw objectivesRes.error;
  const objectives = objectivesRes.data ?? [];

  return {
    totalObjectives: objectives.length,
    completedObjectives: objectives.filter((o) => o.status === "completed").length,
    totalCheckIns: (krCheckInsRes.count ?? 0) + (weeklyCheckInsRes.count ?? 0),
  };
}

export interface CheckInEntry {
  id: string;
  created_at: string;
  input_text: string;
  coaching_response: { message: string; goals_reviewed?: number };
}

/** Save a structured weekly check-in (distinct from coach chat). */
export async function saveWeeklyCheckIn(payload: {
  user_id: string;
  entity_id: string;
  input_text: string;
  coaching_response: { message: string };
  goals_reviewed?: number;
}): Promise<void> {
  const { error } = await supabase.from("ai_coaching_sessions").insert({
    user_id: payload.user_id,
    organization_id: null,
    entity_type: "weekly_checkin",
    entity_id: payload.entity_id,
    input_text: payload.input_text,
    coaching_response: {
      message: payload.coaching_response.message,
      goals_reviewed: payload.goals_reviewed ?? 0,
    },
  });
  if (error) throw error;
}

/** Fetch recent weekly check-ins for the Insights screen. */
export async function getRecentCheckIns(userId: string, limit = 5): Promise<CheckInEntry[]> {
  const { data, error } = await supabase
    .from("ai_coaching_sessions")
    .select("id, created_at, input_text, coaching_response")
    .is("organization_id", null)
    .eq("user_id", userId)
    .eq("entity_type", "weekly_checkin")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as CheckInEntry[];
}

/** Fetch the most recent weekly check-in for the coach context. */
export async function getLatestWeeklyCheckIn(userId: string): Promise<CoachingSession | null> {
  const { data, error } = await supabase
    .from("ai_coaching_sessions")
    .select("*")
    .is("organization_id", null)
    .eq("user_id", userId)
    .eq("entity_type", "weekly_checkin")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as CoachingSession | null;
}
