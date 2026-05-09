import { useCallback, useMemo } from "react";
import type { GameState, Card } from "@/lib/gameData";
import { getPlayerBonuses } from "@/lib/gameLogic";

interface IntroTutorialProps {
  lang: string;
  state: GameState;
  tutorialStep: number;
  isIntroTutorialEnabled: boolean;
}

export interface IntroTutorialStep {
  title: string;
  description: string;
  focus: "goal" | "actions" | "tokens" | "card" | "panel" | "cards" | "nobles" | "timer" | "reserved";
  action: "take-tokens-different" | "buy-card" | "take-tokens-same" | "reserve-card" | "buy-reserved" | "buy-specific-card" | null;
  targetCardId?: number;
  targetGems?: string[];
}

export function useIntroTutorial(props: IntroTutorialProps) {
  const { lang, state, tutorialStep, isIntroTutorialEnabled } = props;

  const introTutorialSteps = useMemo((): IntroTutorialStep[] => [
    {
      title: lang === "fa" ? "هدف: رسیدن به ۱۵ امتیاز" : "Goal: reach 15 points",
      description: lang === "fa" ? "کارت‌های توسعه را بخرید و نجبا را جذب کنید تا امتیاز بگیرید. وقتی بازیکنی به ۱۵ امتیاز می‌رسد، همه دور را تمام می‌کنند و بالاترین امتیاز برنده است." : "Buy development cards and attract nobles to score. When a player reaches 15 points, everyone finishes the round and the highest score wins.",
      focus: "goal",
      action: null,
    },
    {
      title: lang === "fa" ? "یک عمل را انتخاب کنید" : "Choose one action",
      description: lang === "fa" ? "در نوبت خود، دقیقاً یک عمل را انتخاب کنید: گرفتن جواهرات، خرید کارت، رزرو کارت قابل مشاهده، یا رزرو کور از یک دسته." : "On your turn, pick exactly one action: take gems, buy a card, reserve a visible card, or reserve blindly from a deck.",
      focus: "actions",
      action: null,
    },
    {
      title: lang === "fa" ? "گام ۱: جواهرات مختلف را انتخاب کنید" : "Step 1: Take different gems",
      description: lang === "fa" ? "روی یک الماس (سفید)، یک آبی (آبی)، و یک سبز (سبز) کلیک کنید، سپس دکمه بگیر را فشار دهید." : "Click one diamond (white), one blue (blue), and one green (green), then press Take.",
      focus: "tokens",
      action: "take-tokens-different",
      targetGems: ["diamond", "sapphire", "emerald"],
    },
    {
      title: lang === "fa" ? "گام ۲: کارت را خریداری کنید" : "Step 2: Buy the card",
      description: lang === "fa" ? "کارت در گوشه پایین سمت راست را که با جواهرات خود می‌توانید خریداری کنید، کلیک کنید و آن را بخرید. این کارت به شما یک جایزه دائمی قرمز می‌دهد." : "Click and buy the card in the bottom right corner that you can afford with your gems. This card gives you a red permanent bonus.",
      focus: "card",
      action: "buy-specific-card",
    },
    {
      title: lang === "fa" ? "گام ۳: دو توکن همرنگ بگیرید" : "Step 3: Take matching gems",
      description: lang === "fa" ? "روی دو توکن Onyx (سیاه) کلیک کنید تا درک کنید می‌توانید توکن‌های همرنگ بگیرید اگر حداقل ۴ توکن از آن رنگ باقی باشد." : "Click two onyx tokens to understand you can take matching gems if at least 4 remain of that color.",
      focus: "tokens",
      action: "take-tokens-same",
      targetGems: ["onyx", "onyx"],
    },
    {
      title: lang === "fa" ? "گام ۴: کارت دوم را خریدار" : "Step 4: Buy the second card",
      description: lang === "fa" ? "کارت در گوشه پایین سمت راست را که نیاز به ۲ قرمز و ۲ Onyx دارد، خریداری کنید." : "Buy the card in the bottom right corner that requires 2 red and 2 onyx tokens.",
      focus: "card",
      action: "buy-specific-card",
    },
    {
      title: lang === "fa" ? "گام ۵: یک کارت رزرو کنید" : "Step 5: Reserve a card",
      description: lang === "fa" ? "یک کارت را رزرو کنید. شما یک توکن طلا دریافت خواهید کرد که می‌تواند هر رنگ را جایگزین کند." : "Reserve a card. You'll get a gold token that can substitute any color.",
      focus: "reserved",
      action: "reserve-card",
    },
    {
      title: lang === "fa" ? "گام ۶: کارت رزرو شده را خریدار" : "Step 6: Buy reserved card",
      description: lang === "fa" ? "کارت رزرو شده را از پنل خود با استفاده از جواهرات و توکن طلای خود خریداری کنید." : "Buy the reserved card from your panel using your gems and gold token.",
      focus: "panel",
      action: "buy-reserved",
    },
    {
      title: lang === "fa" ? "گام ۷: کارت‌های بیشتر بخرید" : "Step 7: Buy more cards",
      description: lang === "fa" ? "به کارت‌های بیشتر ادامه دهید تا ۳ کارت سفید و ۳ کارت Onyx داشته باشید." : "Continue buying cards until you have 3 white cards and 3 onyx cards.",
      focus: "cards",
      action: "buy-card",
    },
    {
      title: lang === "fa" ? "نجبا" : "Nobles",
      description: lang === "fa" ? "نگاه کنید: نجیب در گوشه بالا سمت راست به طور خودکار به پنل شما منتقل می‌شود زیرا جایزه‌های شما با نیازهای او مطابقت دارند." : "Watch: The noble in the top right automatically moves to your panel because your bonuses match their requirements.",
      focus: "nobles",
      action: null,
    },
    {
      title: lang === "fa" ? "بازی ادامه دارد" : "Game continues",
      description: lang === "fa" ? "حالا که اصول را یاد گرفتید، بازی را ادامه دهید. کارت‌های سطح ۲ و ۳ گران‌تر هستند اما امتیاز بیشتری می‌دهند. به تایمر نوبت توجه کنید." : "Now that you've learned the basics, continue playing. Level 2 and 3 cards cost more but give more points. Watch the turn timer.",
      focus: "timer",
      action: null,
    },
  ], [lang]);

  const isIntroTutorialActionAllowed = useCallback(
    (actionType: "takeTokens" | "buyCard" | "reserveCard", actionData?: any): boolean => {
      // If intro tutorial is not enabled, all actions are allowed
      if (!isIntroTutorialEnabled) {
        return true;
      }

      const step = introTutorialSteps[tutorialStep];
      if (!step) return true;

      switch (tutorialStep) {
        case 0:
        case 1:
          // Informational slides - don't allow actions yet
          return false;
        case 2:
          // Take 3 different gems: diamond, blue, green
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 3) return false;
          const gemSet = new Set(actionData.gems);
          return gemSet.size === 3 && 
                 actionData.gems.includes("diamond") && 
                 actionData.gems.includes("sapphire") && 
                 actionData.gems.includes("emerald");
        case 3:
          // Buy the specific card in bottom right
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          // Find the card that requires diamond, sapphire, emerald
          const targetCard1 = findCardByRequirement(state, ["diamond", "sapphire", "emerald"]);
          return targetCard1 && actionData.card.id === targetCard1.id;
        case 4:
          // Take 2 same onyx tokens
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 2) return false;
          return actionData.gems[0] === actionData.gems[1] && actionData.gems[0] === "onyx";
        case 5:
          // Buy the card requiring 2 red and 2 onyx
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          const targetCard2 = findCardByRequirement(state, ["ruby", "ruby", "onyx", "onyx"]);
          return targetCard2 && actionData.card.id === targetCard2.id;
        case 6:
          // Buy reserved card
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          const currentPlayer = state.players[state.currentPlayerIndex];
          return currentPlayer.reservedCards.some((c) => c.id === actionData.card.id);
        case 7:
          // Buy more cards until 3 white and 3 onyx
          if (actionType !== "buyCard") return false;
          const player = state.players[state.currentPlayerIndex];
          const bonuses = getPlayerBonuses(player);
          return bonuses.diamond >= 3 && bonuses.onyx >= 3;
        case 8:
        case 9:
        case 10:
          // Informational slides
          return false;
        default:
          // Tutorial complete - all actions allowed
          return true;
      }
    },
    [tutorialStep, state, introTutorialSteps, isIntroTutorialEnabled],
  );

  const shouldAutoAdvance = useCallback((): boolean => {
    if (!isIntroTutorialEnabled) return false;

    const step = introTutorialSteps[tutorialStep];
    if (!step) return false;

    switch (tutorialStep) {
      case 7:
        // Auto-advance when player has 3 white and 3 onyx cards
        const player = state.players[state.currentPlayerIndex];
        const bonuses = getPlayerBonuses(player);
        return bonuses.diamond >= 3 && bonuses.onyx >= 3;
      case 9:
        // Auto-advance when noble is attracted
        const player2 = state.players[state.currentPlayerIndex];
        return player2.nobles.length > 0;
      default:
        return false;
    }
  }, [tutorialStep, state, introTutorialSteps, isIntroTutorialEnabled]);

  return {
    introTutorialSteps,
    isIntroTutorialActionAllowed,
    shouldAutoAdvance,
  };
}

function findCardByRequirement(state: GameState, requiredGems: string[]): Card | null {
  for (const level of [3, 2, 1] as const) {
    for (const card of state.visibleCards[level]) {
      if (!card) continue;
      const cardCosts = Object.entries(card.cost).filter(([_, count]) => count > 0);
      const cardGems = cardCosts.flatMap(([gem, count]) => Array(count).fill(gem));
      if (cardGems.length === requiredGems.length) {
        const sortedCard = [...cardGems].sort();
        const sortedRequired = [...requiredGems].sort();
        if (JSON.stringify(sortedCard) === JSON.stringify(sortedRequired)) {
          return card;
        }
      }
    }
  }
  return null;
}
