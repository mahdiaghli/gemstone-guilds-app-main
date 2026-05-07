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
  focus: "goal" | "actions" | "tokens" | "card" | "panel" | "cards" | "nobles" | "timer";
  action: "take-tokens-different" | "buy-card" | "take-tokens-same" | "reserve-card" | "buy-reserved" | null;
}

export interface SplendorTutorialData {
  steps: SplendorTutorialStep[];
  dir: "rtl" | "ltr";
}

export function useSplendorTutorial(props: SplendorTutorialProps) {
  const { lang, tutorialStep, interactiveTutorialEnabled, manualTutorialOpen, state } = props;

  const interactiveTutorialSteps = useMemo((): SplendorTutorialStep[] => [
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
      description: lang === "fa" ? "روی سه جواهر متفاوت (الماس، آبی، سبز) کلیک کنید، سپس دکمه بگیر را فشار دهید." : "Click three different gems (diamond, blue, green), then press Take.",
      focus: "tokens",
      action: "take-tokens-different",
    },
    {
      title: lang === "fa" ? "گام ۲: کارت سطح اول را خریدار" : "Step 2: Buy a level 1 card",
      description: lang === "fa" ? "یک کارت سطح ۱ کلیک کنید که شما می‌توانید با جواهرات خود خریداری کنید. جواهرات خود برای پرداخت استفاده خواهند شد و یک کارت قرمز دائمی جایزه دریافت خواهید کرد." : "Click a level 1 card you can afford with your gems. Your gems will be used for payment and you'll get a red permanent bonus.",
      focus: "card",
      action: "buy-card",
    },
    {
      title: lang === "fa" ? "گام ۳: دو توکن همرنگ بگیرید" : "Step 3: Take matching gems",
      description: lang === "fa" ? "روی دو توکن Onyx (سیاه) کلیک کنید تا درک کنید می‌توانید توکن‌های همرنگ بگیرید اگر حداقل ۴ توکن از آن رنگ باقی باشد." : "Click two onyx tokens to understand you can take matching gems if at least 4 remain of that color.",
      focus: "tokens",
      action: "take-tokens-same",
    },
    {
      title: lang === "fa" ? "گام ۴: یک کارت رزرو کنید" : "Step 4: Reserve a card",
      description: lang === "fa" ? "یک کارت بلندمدت کلیک کنید که نیاز به دو Onyx و دو توکن قرمز دارد و آن را رزرو کنید. شما یک توکن طلا دریافت خواهید کرد." : "Click a card requiring two onyxs and two red tokens and reserve it. You'll get a gold token.",
      focus: "card",
      action: "reserve-card",
    },
    {
      title: lang === "fa" ? "گام ۵: کارت رزرو شده را خریدار" : "Step 5: Buy reserved card",
      description: lang === "fa" ? "کارت رزرو شده را از پنل خود خریداری کنید. توکن طلا می‌تواند هر رنگ را جایگزین کند و به شما کمک می‌کند بدون نیاز به همه جواهرات خریداری کنید." : "Buy the reserved card from your panel. The gold token can substitute any color, helping you afford cards without exact gems.",
      focus: "panel",
      action: "buy-reserved",
    },
    {
      title: lang === "fa" ? "سه سطح کارتی" : "Three card levels",
      description: lang === "fa" ? "کارت‌های سطح ۱ ارزان‌تر هستند. کارت‌های سطح ۲ و ۳ گران‌تر هستند، اما معمولاً امتیاز بیشتر و پیشرفت قوی‌تری می‌دهند." : "Level 1 cards are cheaper. Level 2 and 3 cards cost more, but they usually give more points and stronger progress.",
      focus: "cards",
      action: null,
    },
    {
      title: lang === "fa" ? "بازدیدکنندگان نجیب" : "Noble visitors",
      description: lang === "fa" ? "نجبا اینجا منتظر می‌مانند. اگر جایزه‌های کارت دائمی شما با نیاز یک نجیب پس از خرید مطابقت داشته باشد، آن نجیب به طور خودکار به پنل شما منتقل می‌شود." : "Nobles wait here. If your permanent card bonuses match a noble requirement after buying, that noble automatically moves to your panel.",
      focus: "nobles",
      action: null,
    },
    {
      title: lang === "fa" ? "پنل بازیکن شما" : "Your player panel",
      description: lang === "fa" ? "پنل شما امتیاز، جواهرات متعلق به شما، جایزه‌های کارت دائمی بر اساس رنگ، کارت‌های رزرو شده و نجبایی که جذب کرده‌اید را نشان می‌دهد." : "Your panel shows score, owned gems, permanent card bonuses by color, reserved cards, and nobles you have attracted.",
      focus: "panel",
      action: null,
    },
    {
      title: lang === "fa" ? "تایمر نوبت" : "Turn timer",
      description: lang === "fa" ? "به تایمر در هدر نگاه کنید. نام بازیکنی که نوبتش است نمایش داده می‌شود. عمل خود را قبل از رسیدن به صفر تمام کنید، به خصوص در بازی‌های آنلاین یا زمان‌دار." : "Watch the timer in the header. It shows which player's turn it is. Finish your action before it reaches zero, especially in online or timed games.",
      focus: "timer",
      action: null,
    },
  ], [lang]);

  const isTutorialActionAllowed = useCallback(
    (actionType: "takeTokens" | "buyCard" | "reserveCard", actionData?: any): boolean => {
      // If tutorial is not enabled, all actions are allowed
      if (!(interactiveTutorialEnabled || manualTutorialOpen)) {
        return true;
      }

      // Tutorial step restrictions:
      // Step 0-1: Informational only
      // Step 2: Take 3 different gems (diamond, blue, green)
      // Step 3: Buy a level 1 card
      // Step 4: Take 2 same onyx tokens
      // Step 5: Reserve a card
      // Step 6: Buy reserved card
      // Step 7+: All actions allowed

      switch (tutorialStep) {
        case 0:
        case 1:
          // Informational slides - don't allow actions yet
          return false;
        case 2:
          // Take 3 different gems: ensure it's token selection with 3 different gems
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 3) return false;
          const gemSet = new Set(actionData.gems);
          return gemSet.size === 3; // Must be 3 different gems
        case 3:
          // Buy a level 1 card
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          return actionData.card.level === 1; // Must be level 1
        case 4:
          // Take 2 same onyx tokens
          if (actionType !== "takeTokens") return false;
          if (!actionData?.gems || actionData.gems.length !== 2) return false;
          return actionData.gems[0] === actionData.gems[1] && actionData.gems[0] === "onyx";
        case 5:
          // Reserve a card
          if (actionType === "buyCard") return false; // Don't allow buying at this step
          if (actionType === "takeTokens") return false; // Don't allow tokens
          return actionType === "reserveCard"; // Only allow reserving
        case 6:
          // Buy reserved card
          if (actionType !== "buyCard") return false;
          if (!actionData?.card) return false;
          // Check if card is in reserved list
          const currentPlayer = state.players[state.currentPlayerIndex];
          return currentPlayer.reservedCards.some((c) => c.id === actionData.card.id);
        default:
          // Step 7+: All actions allowed
          return true;
      }
    },
    [tutorialStep, interactiveTutorialEnabled, manualTutorialOpen, state],
  );

  const tutorialData = useMemo((): SplendorTutorialData => ({
    steps: interactiveTutorialSteps,
    dir: lang === "fa" ? "rtl" : "ltr",
  }), [interactiveTutorialSteps, lang]);

  return {
    interactiveTutorialSteps,
    isTutorialActionAllowed,
    tutorialData,
  };
}
