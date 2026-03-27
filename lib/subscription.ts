import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

export const PRO_ENTITLEMENT = "pro";
export const FREE_LIMITS = { maxObjectives: 3 };

export interface SubscriptionStatus {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro =
      typeof customerInfo.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
    return { isPro, customerInfo };
  } catch (err) {
    console.error("[Subscription] getSubscriptionStatus error:", err);
    return { isPro: false, customerInfo: null };
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch (err) {
    console.error("[Subscription] getOfferings error:", err);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}
