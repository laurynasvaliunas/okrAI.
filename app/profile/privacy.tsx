import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, space } from "../../constants/theme";
import { Title3, Body, Caption } from "../../components/Typography";

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: `This Privacy Policy explains how Clyzio MB ("we", "us", "our"), company code 307107260, Polocko g. 2-2, LT-01204 Vilnius, Lithuania, collects and uses your personal data when you use the okrAI app. Contact: info@clyzio.com | +370 615 41336.`,
  },
  {
    title: "2. Data We Collect",
    body: `We collect:\n• Account data: email address, full name, and password (stored securely via Supabase Auth).\n• Profile data: preferred life areas, onboarding choices, and account preferences.\n• Goal data: objectives, key results, progress check-ins, and AI coaching session history you create.\n• Usage data: app interactions, feature usage, and crash reports (collected in aggregate).\n• Payment data: subscription status via RevenueCat. We do not store payment card details.`,
  },
  {
    title: "3. How We Use Your Data",
    body: `We use your data to:\n• Provide, maintain, and improve the App.\n• Personalise AI coaching suggestions based on your goals and life areas.\n• Process subscription payments and verify Pro entitlement.\n• Send transactional emails (e.g. email verification, password reset).\n• Comply with legal obligations.`,
  },
  {
    title: "4. Legal Basis (GDPR)",
    body: `We process your personal data on the following legal bases:\n• Contract performance: to provide the App services you have signed up for.\n• Legitimate interests: to improve the App and ensure security.\n• Consent: for any optional communications you opt into.\n• Legal obligation: where required by EU or Lithuanian law.`,
  },
  {
    title: "5. AI Processing",
    body: `Your goal titles, descriptions, and life area selections are sent to an AI model (Anthropic Claude) to generate coaching suggestions. This processing occurs on Anthropic's servers under appropriate data processing agreements. We minimise the personal data sent and do not send directly identifiable information (e.g. email) to the AI model.`,
  },
  {
    title: "6. Data Sharing",
    body: `We do not sell your personal data. We share data only with:\n• Supabase (database and authentication infrastructure).\n• Anthropic (AI coaching, goal content only).\n• RevenueCat (subscription management).\n• Apple / Google (app store payments).\nAll processors are bound by data processing agreements.`,
  },
  {
    title: "7. Data Retention",
    body: `We retain your account and goal data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.`,
  },
  {
    title: "8. Your Rights",
    body: `Under GDPR, you have the right to:\n• Access your personal data.\n• Correct inaccurate data.\n• Request deletion of your data.\n• Restrict or object to processing.\n• Data portability.\n• Withdraw consent at any time.\n\nTo exercise these rights, contact us at info@clyzio.com. You may also lodge a complaint with the State Data Protection Inspectorate of Lithuania (VDAI) at www.vdai.lrv.lt.`,
  },
  {
    title: "9. Data Security",
    body: `We use industry-standard security measures including encryption at rest and in transit, row-level security on our database, and access controls. However, no system is perfectly secure and we cannot guarantee absolute security.`,
  },
  {
    title: "10. International Transfers",
    body: `Our infrastructure providers (Supabase, Anthropic, RevenueCat) may process data outside the European Economic Area. Where this occurs, we ensure appropriate safeguards are in place (e.g. Standard Contractual Clauses).`,
  },
  {
    title: "11. Children",
    body: `The App is not directed at children under 16. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    title: "12. Cookies & Analytics",
    body: `The App does not use browser cookies. We may collect anonymous analytics data (crash reports, feature usage) to improve the App. This data cannot be used to identify you individually.`,
  },
  {
    title: "13. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes via the App or by email. The date at the top of this policy indicates when it was last updated.`,
  },
  {
    title: "14. Contact Us",
    body: `For privacy-related questions or to exercise your rights:\n\nClyzio MB\nPolocko g. 2-2, LT-01204 Vilnius, Lithuania\ninfo@clyzio.com\n+370 615 41336`,
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space.md, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Title3>Privacy Policy</Title3>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Caption style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: 27 March 2026
        </Caption>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Body style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Body>
            <Body style={{ color: colors.textSecondary, lineHeight: 22 }}>{section.body}</Body>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },
  lastUpdated: {
    marginBottom: space.xl,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: space.sm,
  },
});
