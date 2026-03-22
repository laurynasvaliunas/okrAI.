import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  account_type: string;
  onboarding_completed: boolean;
  preferred_life_areas: string[] | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) =>
    set({ profile }),

  setLoading: (loading) =>
    set({ loading }),

  signOut: () =>
    set({ user: null, session: null, profile: null }),
}));
