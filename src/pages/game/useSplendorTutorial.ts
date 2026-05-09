import { useMemo, useCallback } from "react";
import type { GameState } from "@/lib/gameData";

interface SplendorTutorialProps {
  lang: string;
  tutorialStep: number;
  interactiveTutorialEnabled: boolean;
  manualTutorialOpen: boolean;
  state: GameState;
}

export interface SplendorTutorialStep {
  title: string;
  description: string;
  focus:
    | "goal"
    | "actions"
    | "tokens"
    | "card"
    | "panel"
    | "cards"
    | "nobles"
    | "timer";
  action:
    | "take-tokens-different"
    | "buy-card"
    | "take-tokens-same"
    | "reserve-card"
    | "buy-reserved"
    | null;
}

export interface SplendorTutorialData {
  steps: SplendorTutorialStep[];
  dir: "rtl" | "ltr";
  isRTL: boolean;
}

export function useSplendorTutorial(props: SplendorTutorialProps) {
  const {
    lang,
    tutorialStep,
    interactiveTutorialEnabled,
    manualTutorialOpen,
    state,
  } = props;

  const isRTL = lang === "fa";

  const interactiveTutorialSteps = useMemo(
    (): SplendorTutorialStep[] => [
      {
        title: isRTL ? "هدف: رسیدن به ۱۵ امتیاز" : "Goal: reach 15 points",
        description: isRTL
          ? "کارت‌های توسعه را بخرید و نجبا را جذب کنید تا امتیاز بگیرید. وقتی بازیکنی به ۱۵ امتیاز می‌رسد، همه دور را تمام می‌کنند و بازیکنی با بالاترین امتیاز برنده می‌شود."
          : "Buy development cards and attract nobles to score. When a player reaches 15 points, everyone finishes the round and the highest score wins.",
        focus: "goal",
        action: null,
      },
      {
        title: isRTL ? "یک عمل را انتخاب کنید" : "Choose one action",
        description: isRTL
          ? "در نوبت خود، دقیقاً یک عمل را انجام می‌دهید: گرفتن جواهرات، خرید کارت، رزرو یکی از کارت‌های قابل‌مشاهده یا رزرو کور از یک دسته."
          : "On your turn, pick exactly one action: take gems, buy a card, reserve a visible card, or reserve blindly from a deck.",
        focus: "actions",
        action: null,
      },
      {
        title: isRTL ? "گام ۱: جواهرات مختلف را بردارید" : "Step 1: Take different gems",
        description: isRTL
          ? "روی سه جواهر متفاوت (الماس، یاقوت آبی، زمرد) کلیک کنید، سپس دکمهٔ «گرفتن» را بزنید."
          : "Click three different gems (diamond, sapphire, emerald), then press Take.",
        focus: "tokens",
        action: "take-tokens-different",
      },
      {
        title: isRTL ? "گام ۲: یک کارت سطح اول بخرید" : "Step 2: Buy a level 1 card",
        description: isRTL
          ? "روی یک کارت سطح ۱ کلیک کنید که می‌توانید با جواهرات فعلی خود بخرید. جواهرات برای پرداخت خرج می‌شوند و یک جایزهٔ دائمی قرمز می‌گیرید."
          : "Click a level 1 card you can afford with your gems. Your gems will be used for payment and you'll get a red permanent bonus.",
        focus: "card",
        action: "buy-card",
      },
      {
        title: isRTL ? "گام ۳: دو ژتون همرنگ بگیرید" : "Step 3: Take matching gems",
        description: isRTL
          ? "روی دو ژتون اونیکس (سیاه) کلیک کنید تا ببینید وقتی حداقل ۴ ژتون از یک رنگ باقی‌مانده باشد، می‌توانید دو ژتون همرنگ بردارید."
          : "Click two onyx tokens to understand you can take matching gems if at least 4 remain of that color.",
        focus: "tokens",
        action: "take-tokens-same",
      },
      {
        title: isRTL ? "گام ۴: یک کارت را رزرو کنید" : "Step 4: Reserve a card",
        description: isRTL
          ? "روی کارتی که به دو اونیکس و دو ژتون قرمز نیاز دارد کلیک کنید و آن را رزرو کنید. یک ژتون طلا دریافت خواهید کرد."
          : "Click a card requiring two onyxs and two red tokens and reserve it. You'll get a gold token.",
        focus: "card",
        action: "reserve-card",
      },
      {
        title: isRTL ? "گام ۵: کارت رزروشده را بخرید" : "Step 5: Buy reserved card",
        description: isRTL
          ? "کارت رزروشده را از پنل خود بخرید. ژتون طلا می‌تواند جای هر رنگی را بگیرد و کمک می‌کند بدون داشتن تمام جواهرات لازم، کارت را بخرید."
          : "Buy the reserved card from your panel. The gold token can substitute any color, helping you afford cards without exact gems.",
        focus: "panel",
        action: "buy-reserved",
      },
      {
        title: isRTL ? "سه سطح کارت" : "Three card levels",
        description: isRTL
          ? "کارت‌های سطح ۱ ارزان‌ترند. کارت‌های سطح ۲ و ۳ گران‌ترند، اما معمولاً امتیاز بیشتری می‌دهند و پیشرفتتان را سریع‌تر می‌کنند."
          : "Level 1 cards are cheaper. Level 2 and 3 cards cost more, but they usually give more points and stronger progress.",
        focus: "cards",
        action: null,
      },
      {
        title: isRTL ? "نجبای بازدیدکننده" : "Noble visitors",
        description: isRTL
          ? "نجبا اینجا منتظر می‌مانند. اگر جایزه‌های دائمی کارت‌های شما پس از خرید با نیاز یک نجیب هماهنگ شود، آن نجیب به‌طور خودکار به پنل شما می‌آید."
          : "Nobles wait here. If your permanent card bonuses match a noble requirement after buying, that noble automatically moves to your panel.",
        focus: "nobles",
        action: null,
      },
      {
        title: isRTL ? "پنل بازیکن شما" : "Your player panel",
        description: isRTL
          ? "پنل شما امتیاز، جواهرات، جایزه‌های دائمی رنگ‌ها، کارت‌های رزروشده و نجبایی را که جذب کرده‌اید نشان می‌دهد."
          : "Your panel shows score, owned gems, permanent card bonuses by color, reserved cards, and nobles you have attracted.",
        focus: "panel",
        action: null,
      },
      {
        title: isRTL ? "تایمر نوبت" : "Turn timer",
        description: isRTL
          ? "به تایمر در هدر توجه کنید. نام بازیکنی که نوبتش است نشان داده می‌شود. مخصوصاً در بازی‌های آنلاین یا زمان‌دار، عمل خود را قبل از صفر شدن تایمر انجام دهید."
          : "Watch the timer in the header. It shows which player's turn it is. Finish your action before it reaches zero, especially in online or timed games.",
        focus: "timer",
        action: null,
      },
    ],
    [isRTL],
  );

  const isTutorialActionAllowed = useCallback(
    (actionType: "takeTokens" | "buyCard" | "reserveCard", actionData?: any): boolean => {
      if (!(interactiveTutorialEnabled || manualTutorialOpen)) {
        return true;
      }

      switch (tutorialStep) {
        case 0:
        case 1:
          return false;
        case 2: {
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 3) return false;
          const gemSet = new Set(actionData.gems);
          return gemSet.size === 3;
        }
        case 3: {
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          return actionData.card.level === 1;
        }
        case 4: {
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 2) return false;
          return (
            actionData.gems[0] === actionData.gems[1] &&
            actionData.gems[0] === "onyx"
          );
        }
        case 5: {
          if (actionType === "buyCard") return false;
          if (actionType === "takeTokens") return false;
          return actionType === "reserveCard";
        }
        case 6: {
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          const currentPlayer = state.players[state.currentPlayerIndex];
          return currentPlayer.reservedCards.some(
            (c) => c.id === actionData.card.id,
          );
        }
        default:
          return true;
      }
    },
    [tutorialStep, interactiveTutorialEnabled, manualTutorialOpen, state],
  );

  const tutorialData = useMemo(
    (): SplendorTutorialData => ({
      steps: interactiveTutorialSteps,
      dir: isRTL ? "rtl" : "ltr",
      isRTL,
    }),
    [interactiveTutorialSteps, isRTL],
  );

  return {
    interactiveTutorialSteps,
    isTutorialActionAllowed,
    tutorialData,
  };
}
