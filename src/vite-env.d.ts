/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  readonly VITE_REQUIRE_PREMIUM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface NativeProductPurchasePayload {
  provider: "cafe-bazaar" | "myket" | "app-store";
  productId: string;
  offerId: string;
  userId?: string;
}


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
    purchaseProduct?: (payload: NativeProductPurchasePayload) => Promise<NativeSubscriptionPurchaseResult>;
    purchaseSubscription?: (
      payload: NativeSubscriptionPurchasePayload,
    ) => Promise<NativeSubscriptionPurchaseResult>;
  };
}
