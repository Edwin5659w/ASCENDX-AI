import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { billingApi } from '@/src/api/services';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const ENTITLEMENT = 'pro';

let configured = false;

export function isRevenueCatConfigured(): boolean {
  return Boolean(API_KEY && Platform.OS !== 'web');
}

export async function configureRevenueCat(userId: string) {
  if (!isRevenueCatConfigured() || configured) return;
  Purchases.setLogLevel(LOG_LEVEL.INFO);
  Purchases.configure({ apiKey: API_KEY!, appUserID: userId });
  configured = true;
}

export async function getProPackage(): Promise<PurchasesPackage | null> {
  if (!isRevenueCatConfigured()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages[0] ?? null;
}

export async function purchasePro(userId: string): Promise<boolean> {
  await configureRevenueCat(userId);
  const pkg = await getProPackage();
  if (!pkg) return false;
  await Purchases.purchasePackage(pkg);
  await billingApi.revenueCatSync();
  return true;
}

export async function restorePurchases(userId: string): Promise<boolean> {
  await configureRevenueCat(userId);
  await Purchases.restorePurchases();
  await billingApi.revenueCatSync();
  return true;
}
