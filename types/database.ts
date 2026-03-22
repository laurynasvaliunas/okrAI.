/**
 * Database row types matching Supabase schema (snake_case).
 */

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  account_type: string;
  onboarding_completed: boolean;
  preferred_life_areas: string[] | null;
}

export interface ObjectiveRow {
  id: string;
  owner_id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  life_area: string;
  cadence: "weekly" | "monthly" | "quarterly";
  time_period: string;
  status: "active" | "completed" | "archived";
  progress: number;
  is_private: boolean;
  created_at: string;
}

export interface KeyResultRow {
  id: string;
  objective_id: string;
  owner_id: string;
  organization_id: string | null;
  title: string;
  metric_type: "number" | "percentage" | "boolean";
  start_value: number;
  current_value: number;
  target_value: number;
  unit: string | null;
  due_date: string | null;
  created_at: string;
}

export interface CheckInRow {
  id: string;
  key_result_id: string;
  owner_id: string;
  organization_id: string | null;
  value: number;
  created_at: string;
}

export interface CoachingSessionRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  entity_type: string;
  entity_id: string | null;
  input_text: string;
  coaching_response: { message: string };
  created_at: string;
}

export interface PersonalSubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  created_at?: string;
  updated_at?: string;
}
