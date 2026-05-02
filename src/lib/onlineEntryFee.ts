import { refundGameEntryFee } from "@/lib/progression";

const ENTRY_FEE_SESSION_KEY = "splendor-online-entry-fee";

interface PendingEntryFee {
  charged: number;
  feeMode: string;
  refunded: boolean;
}

export function readPendingEntryFee(): PendingEntryFee | null {
  try {
    const raw = sessionStorage.getItem(ENTRY_FEE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingEntryFee() {
  sessionStorage.removeItem(ENTRY_FEE_SESSION_KEY);
}

export function markPendingEntryFeeConsumed() {
  const fee = readPendingEntryFee();
  if (!fee) return;
  clearPendingEntryFee();
}

export function refundPendingEntryFee(userId?: string | null) {
  const fee = readPendingEntryFee();
  if (!fee || fee.refunded || !fee.charged) {
    clearPendingEntryFee();
    return false;
  }

  refundGameEntryFee(userId, fee.charged);
  sessionStorage.setItem(
    ENTRY_FEE_SESSION_KEY,
    JSON.stringify({ ...fee, refunded: true }),
  );
  clearPendingEntryFee();
  return true;
}
