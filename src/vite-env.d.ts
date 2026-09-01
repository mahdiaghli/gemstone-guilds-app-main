/// <reference types="vite/client" />

interface NativeSubscriptionPurchaseResult {
  success: boolean;
  message?: string;
}

interface NativeSubscriptionPurchasePayload {
  provider: "cafe-bazaar" | "myket" | "app-store";
  planId: string;
  productId: string;
  userId?: string;
}

interface Window {
  GemstoneNativeBilling?: {
    purchaseSubscription?: (
      payload: NativeSubscriptionPurchasePayload,
    ) => Promise<NativeSubscriptionPurchaseResult>;
  };
}
