import backcard1Img from "@/assets/backcard1.png";
import backcard2Img from "@/assets/backcard2.png";
import backcard3Img from "@/assets/backcard3.png";
import royalCardBackImg from "@/assets/Gemini_Generated_Image_5om85h5om85h5om8.png";

export type CardBackId = "classic" | "royal";

export const CARD_BACK_LABELS: Record<CardBackId, string> = {
  classic: "Classic",
  royal: "Royal Guild",
};

export const CARD_BACK_PREVIEWS: Record<CardBackId, string> = {
  classic: backcard1Img,
  royal: royalCardBackImg,
};

export function buildBackCardsByLevel(selectedCardBack: CardBackId) {
  if (selectedCardBack === "royal") {
    return {
      1: royalCardBackImg,
      2: royalCardBackImg,
      3: royalCardBackImg,
    } as const;
  }

  return {
    1: backcard1Img,
    2: backcard2Img,
    3: backcard3Img,
  } as const;
}
