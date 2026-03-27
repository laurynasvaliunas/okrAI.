import { ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, space } from "../../constants/theme";
import { Display, Title3, Body, Caption } from "../../components/Typography";

const SECTIONS = [
  {
    title: "1. Agreement to Terms",
    body: `By downloading, installing, or using okrAI ("App"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the App.`,
  },
  {
    title: "2. About Us",
    body: `okrAI is operated by Clyzio MB, company code 307107260, registered at Polocko g. 2-2, LT-01204 Vilnius, Lithuania. Contact: info@clyzio.com | +370 615 41336.`,
  },
  {
    title: "3. Description of Service",
    body: `okrAI is a personal productivity app that helps you set, track, and achieve Objectives and Key Results (OKRs) using AI-powered coaching. The App is intended for personal, non-commercial use.`,
  },
  {
    title: "4. Account Registration",
    body: `You must create an account to use the App. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must be at least 16 years old to use the App.`,
  },
  {
    title: "5. Subscription & Payments",
    body: `The App offers a free tier and a Pro subscription. Subscriptions are billed through the Apple App Store or Google Play Store. Prices are displayed before purchase. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. You may cancel at any time through your app store account settings. No refunds are provided for partial subscription periods except as required by applicable law.`,
  },
  {
    title: "6. AI-Generated Content",
    body: `The App uses artificial intelligence to provide coaching suggestions and guidance. AI-generated content is provided for informational and motivational purposes only and does not constitute professional advice (medical, financial, psychological, or otherwise). You should consult qualified professionals for any such advice. Clyzio MB makes no warranties regarding the accuracy or completeness of AI-generated content.`,
  },
  {
    title: "7. User Content",
    body: `You retain ownership of the goals, key results, and other content you create in the App ("User Content"). By using the App, you grant Clyzio MB a limited licence to store and process your User Content solely to provide the App's services. We do not sell your User Content to third parties.`,
  },
  {
    title: "8. Prohibited Uses",
    body: `You agree not to: (a) use the App for any unlawful purpose; (b) attempt to reverse engineer, decompile, or hack the App; (c) use automated tools to scrape or access the App; (d) impersonate any person or entity; (e) transmit any harmful, offensive, or infringing content.`,
  },
  {
    title: "9. Intellectual Property",
    body: `All content, trademarks, and technology in the App (excluding User Content) are owned by or licensed to Clyzio MB. You may not copy, modify, distribute, or create derivative works without our written permission.`,
  },
  {
    title: "10. Availability & Changes",
    body: `We strive to keep the App available at all times but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the App at any time with reasonable notice where possible.`,
  },
  {
    title: "11. Disclaimer of Warranties",
    body: `The App is provided "as is" and "as available" without warranties of any kind, express or implied, to the fullest extent permitted by applicable law.`,
  },
  {
    title: "12. Limitation of Liability",
    body: `To the maximum extent permitted by law, Clyzio MB shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App. Our total liability to you shall not exceed the amount you paid for the App in the 12 months preceding the claim.`,
  },
  {
    title: "13. Governing Law",
    body: `These Terms are governed by the laws of the Republic of Lithuania. Disputes shall be resolved in the courts of Vilnius, Lithuania, unless mandatory consumer protection laws in your country of residence provide otherwise.`,
  },
  {
    title: "14. Changes to Terms",
    body: `We may update these Terms from time to time. We will notify you of material changes via the App or by email. Continued use of the App after changes constitutes acceptance of the new Terms.`,
  },
  {
    title: "15. Contact",
    body: `For questions about these Terms, contact us at:\n\nClyzio MB\nPolocko g. 2-2, LT-01204 Vilnius, Lithuania\ninfo@clyzio.com\n+370 615 41336`,
  },
];

export default function TermsScreen() {
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
        <Title3>Terms & Conditions</Title3>
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
