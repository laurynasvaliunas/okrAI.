import { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signUp } from "../../lib/auth";
import { space, radius, useTheme } from "../../constants/theme";
import { Display, Headline, Body, Caption } from "../../components/Typography";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import type { Profile } from "../../stores/authStore";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as { message: string }).message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const { colors, isDark } = useTheme();

  const { setSession, setProfile } = useAuthStore();
  const router = useRouter();

  async function handleSignUp() {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await signUp(email.trim(), password, fullName.trim());

      if (!data.session) {
        setSentEmail(email.trim());
        setEmailSent(true);
        return;
      }

      setSession(data.session);

      if (data.session?.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();
          if (!profileError && profileData) setProfile(profileData as Profile);
        } catch {
          // Non-fatal — _layout.tsx onAuthStateChange will load the profile
        }
      }
    } catch (err: unknown) {
      console.error("[Register] signup error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.confirmedContainer, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <Ionicons name="mail-outline" size={56} color={colors.accent} />
        <Headline style={{ marginTop: space.xl, textAlign: "center" }}>
          Check your email
        </Headline>
        <Body
          color={colors.textSecondary}
          style={{ textAlign: "center", marginTop: space.md, marginBottom: space.xxxl }}
        >
          We sent a confirmation link to {sentEmail}. Please verify your account before signing in.
        </Body>
        <Button
          variant="primary"
          size="lg"
          title="Go to Login"
          onPress={() => router.replace("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Display>Create account</Display>
            <Body color={colors.textSecondary} style={{ marginTop: space.sm }}>
              Start your personal OKR journey today
            </Body>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Jane Smith"
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={(v) => { setFullName(v); setError(null); }}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
            />

            <Input
              label="Password"
              placeholder="Min. 6 characters"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}>
                <Caption color={colors.error}>{error}</Caption>
              </View>
            ) : null}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              title={submitting ? "Creating account\u2026" : "Create Account"}
              loading={submitting}
              onPress={handleSignUp}
            />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
              <Body color={colors.textSecondary}>
                Already have an account?{" "}
                <Body color={colors.accent}>Sign In</Body>
              </Body>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: space.xxl,
    justifyContent: "center",
    paddingVertical: space.massive + space.lg,
  },
  header: {
    marginBottom: space.xxxl + space.xs,
  },
  form: {
    gap: space.xs,
    marginBottom: space.xxxl,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: radius.sm + 2,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md - 2,
    marginBottom: space.lg,
  },
  confirmedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xxxl,
  },
  linkRow: {
    alignItems: "center",
  },
});
