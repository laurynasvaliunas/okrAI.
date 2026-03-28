import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

export const initializePurchases = () => {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;
  const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;
  if (Platform.OS === "ios") {
    Purchases.configure({ apiKey: iosApiKey });
  } else if (Platform.OS === "android") {
    Purchases.configure({ apiKey: androidApiKey });
  }
};

export async function logInPurchases(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.error("[Purchases] logIn error:", err);
  }
}

export async function logOutPurchases(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (err) {
    console.error("[Purchases] logOut error:", err);
  }
}
