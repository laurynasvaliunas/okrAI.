# App Store Submission Checklist — okrAI

## ✅ Done (code/config complete)
- [x] Bundle ID: `com.clyzio.okrai` (iOS) / `com.clyzio.okrai` (Android)
- [x] App name: `okrAI`
- [x] Splash screen background matches dark theme (#0B0D0D)
- [x] `ios.buildNumber: "1"` and `android.versionCode: 1` set
- [x] EAS `autoIncrement: true` in production profile
- [x] NSUserTrackingUsageDescription set in infoPlist
- [x] UIBackgroundModes remote-notification set
- [x] Android permissions declared
- [x] Auth tokens stored in Secure Enclave (expo-secure-store)
- [x] No verbose logs in production (DEV-gated)
- [x] RevenueCat log level: ERROR in production
- [x] EAS CLI installed globally
- [x] `eas.json` configured with dev/preview/production profiles
- [x] GitHub Actions CI/CD workflow at `.github/workflows/build.yml`
- [x] `google-service-account.json` in `.gitignore`
- [x] App Store listing copy written → `store-assets/app-store-listing.md`
- [x] Google Play listing copy written → `store-assets/google-play-listing.md`
- [x] Privacy Policy page written → `store-assets/privacy-policy.html`

---

## 🔑 Your Action Required

### Step 1 — EAS Login & Configure (5 min)
```bash
cd /Users/LaurynasValiunas/Documents/okrAI
eas login          # log in with your Expo account
eas build:configure  # links project to EAS, generates projectId in app.json
```

### Step 2 — iOS Signing (10 min)
```bash
eas credentials    # select iOS → Auto-manage → EAS handles provisioning profile
```
Or let it auto-generate on first `eas build --platform ios --profile production`.

You need:
- [ ] Apple Developer Program membership ($99/yr) active
- [ ] Your **Apple Team ID** — find at developer.apple.com → Membership
- [ ] Your **Apple ID email** (the one on the Dev account)

Update `eas.json` submit section:
```json
"ios": {
  "appleId": "you@example.com",
  "ascAppId": "1234567890",      ← from App Store Connect app record
  "appleTeamId": "XXXXXXXXXX"
}
```

### Step 3 — App Store Connect App Record (10 min)
1. Go to appstoreconnect.apple.com
2. Apps → + → New App
3. Platform: iOS, Name: **okrAI**, Bundle ID: **com.clyzio.okrai**
4. Copy the **App ID** (numeric) → paste into eas.json `ascAppId`
5. Fill listing from `store-assets/app-store-listing.md`
6. Upload Privacy Policy: host `store-assets/privacy-policy.html` at **okrai.io/privacy** first

### Step 4 — Google Play App Record (10 min)
1. Go to play.google.com/console
2. Create app → App name: **okrAI – Personal Goal Tracker**
3. Fill store listing from `store-assets/google-play-listing.md`
4. Set up Google service account for automated publishing:
   - Play Console → Setup → API access → Create service account
   - Download JSON → save as `google-service-account.json` in project root (already gitignored)

### Step 5 — GitHub Secret (2 min)
1. Run `eas whoami` to confirm you're logged in, then:
   ```bash
   # Get your Expo token
   cat ~/.expo/state.json | grep token
   ```
2. GitHub repo → Settings → Secrets → Actions → New repository secret
   - Name: `EXPO_TOKEN`
   - Value: paste the token

### Step 6 — Screenshots
Required sizes:
| Store | Size | Count |
|-------|------|-------|
| App Store 6.9" iPhone | 1320 × 2868 px | min 3 |
| App Store 6.5" iPhone | 1242 × 2688 px | min 3 |
| App Store 12.9" iPad  | 2048 × 2732 px | optional |
| Google Play phone     | 1080 × 1920 px | min 2 |

Recommended screens to capture:
1. Home screen with progress rings
2. Goals list with multiple objectives
3. Goal detail with key results
4. AI Coach chat
5. New Goal creation screen

Tools: Xcode Simulator → File → Save Screenshot, or use a device.

### Step 7 — Host Privacy Policy
Upload `store-assets/privacy-policy.html` to your web host at:
**https://okrai.io/privacy**

Both stores require a live URL before submission.

### Step 8 — First Production Build
```bash
eas build --platform all --profile production
# or trigger automatically by pushing to main (GitHub Actions)
```

### Step 9 — Submit
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## App Review Notes
- Create a **demo account** (email + password) to put in App Store Connect review notes
- Mention in-app purchases are available (RevenueCat sandbox works in review)
- Copy from `store-assets/app-store-listing.md` section "App Review Information"
