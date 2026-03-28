import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "Check your .env.local file and ensure the app was rebuilt after adding env vars."
  );
}

// SecureStore adapter — stores auth tokens in the device keychain/keystore
// instead of unencrypted AsyncStorage. Falls back to in-memory on web.
const SecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") return null;
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") return;
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") return;
    return SecureStore.deleteItemAsync(key);
  },
};

// Persist session in SecureStore so refresh tokens survive app restarts (required for reliable auth + RLS).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
