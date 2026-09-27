import { payGameEntryFee } from "@/lib/progression";

export function prepareOnlineMatchmaking(
  userId: string | null | undefined,
  gameId: string,
) {
  const feeMode = "onlineMatchmaking" as const;
  const feeResult = payGameEntryFee(userId, feeMode);

  if (!feeResult.ok) return feeResult;

  sessionStorage.setItem(
    "splendor-online-entry-fee",
    JSON.stringify({
      charged: feeResult.charged,
      feeMode,
      refunded: false,
    }),
  );
  sessionStorage.setItem("matchmaking-players", "2");
  sessionStorage.setItem("matchmaking-game", gameId);

  if (gameId === "dead-mans-draw") {
    sessionStorage.removeItem("matchmaking-turnTime");
  } else {
    sessionStorage.setItem("matchmaking-turnTime", "15");
  }

  return {
    ...feeResult,
    path: `/online-matchmaking?game=${encodeURIComponent(gameId)}`,
  };
}
