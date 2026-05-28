import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import GameBoard from "@/components/game/GameBoard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import {
  type Card,
  type GameState,
  type GemType,
  type Noble,
  type Player,
  type TokenType,
} from "@/lib/gameData";
import {
  performPurchaseCard,
  performTakeTokens,
} from "@/lib/gameLogic";
import SplendorGameShell from "@/pages/game/SplendorGameShell";
import splendorBackground from "@/assets/background-game-splendor.png";
import backcard1Img from "@/assets/backcard1.webp";
import backcard2Img from "@/assets/backcard2.webp";
import backcard3Img from "@/assets/backcard3.webp";
import { gemTokenImages } from "@/components/game/GemToken";

const FIRST_CARD_ID = "tutorial-first-card";
const SECOND_CARD_ID = "tutorial-second-card";
const RESERVED_CARD_ID = "tutorial-reserved-card";
const TARGET_NOBLE_ID = 999;
const FLIGHT_DURATION_MS = 650;

type TutorialFlightAnimation = {
  id: string;
  kind: "token" | "card";
  start: { x: number; y: number };
  end: { x: number; y: number };
  imageUrl?: string;
  color?: string;
  label?: string;
};

const makeCard = (
  id: string,
  level: 1 | 2 | 3,
  gemBonus: Card["gemBonus"],
  cost: Card["cost"],
  points = 0,
): Card => ({ id, level, gemBonus, cost, points });

const makeNoble = (
  id: number,
  requirements: Noble["requirements"],
  points = 3,
): Noble => ({
  id,
  requirements,
  points,
});

const makeBonusCard = (id: string, gemBonus: Card["gemBonus"]): Card =>
  makeCard(id, 1, gemBonus, {}, 0);

const createTutorialState = (): GameState => {
  const firstCard = makeCard(
    FIRST_CARD_ID,
    1,
    "ruby",
    {
      diamond: 1,
      sapphire: 1,
      emerald: 1,
    },
    1,
  );
  const secondCard = makeCard(
    SECOND_CARD_ID,
    1,
    "onyx",
    {
      ruby: 2,
      onyx: 2,
    },
    1,
  );
  const reservedCard = makeCard(
    RESERVED_CARD_ID,
    2,
    "diamond",
    {
      diamond: 3,
      onyx: 4,
    },
    1,
  );

  const expensiveCards: Card[] = [
    makeCard("tutorial-l1-a", 1, "diamond", { diamond: 4, sapphire: 1, emerald: 1 }),
    makeCard("tutorial-l1-b", 1, "sapphire", { ruby: 3, onyx: 2 }),
    makeCard("tutorial-l1-c", 1, "emerald", { diamond: 2, sapphire: 2, emerald: 2 }),
    makeCard("tutorial-l2-a", 2, "ruby", { diamond: 5, sapphire: 4, emerald: 3 }),
    makeCard("tutorial-l2-b", 2, "onyx", { ruby: 5, emerald: 4, onyx: 3 }),
    makeCard("tutorial-l2-c", 2, "diamond", { sapphire: 5, ruby: 5 }),
    makeCard("tutorial-l2-d", 2, "sapphire", { diamond: 5, onyx: 4 }),
    makeCard("tutorial-l3-a", 3, "emerald", { diamond: 7, sapphire: 3, emerald: 3 }, 4),
    makeCard("tutorial-l3-b", 3, "ruby", { ruby: 7, onyx: 3, diamond: 3 }, 5),
    makeCard("tutorial-l3-c", 3, "onyx", { sapphire: 7, emerald: 3, ruby: 3 }, 4),
    makeCard("tutorial-l3-d", 3, "diamond", { diamond: 3, sapphire: 6, onyx: 3 }, 4),
  ];

  const player: Player = {
    id: 0,
    name: "Player 1",
    tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 1, onyx: 0, gold: 1 },
    cards: [
      makeBonusCard("tutorial-start-diamond-1", "diamond"),
      makeBonusCard("tutorial-start-diamond-2", "diamond"),
      makeBonusCard("tutorial-start-onyx-1", "onyx"),
      makeBonusCard("tutorial-start-onyx-2", "onyx"),
    ],
    reservedCards: [reservedCard],
    nobles: [],
  };

  return {
    players: [
      player,
      {
        id: 1,
        name: "Player 2",
        tokens: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
        cards: [],
        reservedCards: [],
        nobles: [],
      },
    ],
    currentPlayerIndex: 0,
    tokenPool: { diamond: 4, sapphire: 4, emerald: 4, ruby: 3, onyx: 4, gold: 4 },
    decks: {
      1: [secondCard, expensiveCards[0], expensiveCards[1], expensiveCards[2]],
      2: [expensiveCards[3], expensiveCards[4], expensiveCards[5], expensiveCards[6]],
      3: [expensiveCards[7], expensiveCards[8], expensiveCards[9], expensiveCards[10]],
    },
    visibleCards: {
      1: [expensiveCards[0], expensiveCards[1], expensiveCards[2], firstCard],
      2: [expensiveCards[3], expensiveCards[4], expensiveCards[5], expensiveCards[6]],
      3: [expensiveCards[7], expensiveCards[8], expensiveCards[9], expensiveCards[10]],
    },
    nobles: [
      makeNoble(101, { ruby: 4 }),
      makeNoble(102, { emerald: 4 }),
      makeNoble(TARGET_NOBLE_ID, { diamond: 3, onyx: 3 }),
    ],
    isLastRound: false,
    lastRoundTriggerIndex: null,
    gameOver: false,
    winner: null,
  };
};

// حالا ۱۰ مرحله داریم: ۰ تا ۹
type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type TutorialCopy = {
  title: string;
  body: string;
  cta?: string;
  helper?: string;
};

export default function SplendorStepByStepTutorial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, t, dir } = useLanguage();
  const [step, setStep] = useState<TutorialStep>(0);
  const [state, setState] = useState<GameState>(() => createTutorialState());
  const [selectedGems, setSelectedGems] = useState<GemType[]>([]);
  const [tempPoolDisplay, setTempPoolDisplay] =
    useState<Record<TokenType, number> | null>(null);
  const [nobleQueued, setNobleQueued] = useState(false);
  const [flightAnimations, setFlightAnimations] = useState<
    TutorialFlightAnimation[]
  >([]);
  const flightTimeoutsRef = useRef<number[]>([]);
  const isFirstTimeTutorial = searchParams.get("first") === "1";
  const defaultReturnPath = isFirstTimeTutorial
    ? "/menu/splendor"
    : "/tutorial?game=splendor";

  const currentPlayer = state.players[0];

  const copy = useMemo<Record<TutorialStep, TutorialCopy>>(
    () => ({
      0: {
        title: lang === "fa" ? "هدف بازی" : "Goal of the game",
        body:
          lang === "fa"
            ? "هدف شما رسیدن به ۱۵ امتیاز است. امتیاز هر کارت در گوشهٔ بالا-چپ کارت نوشته شده است."
            : "Reach 15 points to win. Each card’s points are shown at its top-left corner.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      1: {
        title:
          lang === "fa"
            ? "سه سطح کارت"
            : "Three levels of cards",
        body:
          lang === "fa"
            ? "کارت‌ها سه سطح دارند: سطح‌های بالاتر معمولاً امتیاز بیشتر و هزینهٔ بیشتری دارند."
            : "Cards come in three levels. Higher levels usually cost more but give more points.",
        // helper:
        //   lang === "fa"
        //     ? "به سه ردیف کارت با قاب‌های متفاوت نگاه کنید."
        //     : "Look at the three rows of cards with different backs.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      2: {
        title:
          lang === "fa"
            ? "کارهایی که هر نوبت می‌توانید انجام دهید"
            : "What you can do each turn",
        body:
          lang === "fa"
            ? "۱) گرفتن ۳ ژتون متفاوت، یا ۲) گرفتن ۲ ژتون هم‌رنگ، یا ۳) خرید یک کارت، یا ۴) رزرو یک کارت و گرفتن یک ژتون طلا."
            : "1) take 3 different tokens, 2) take 2 of a same token, 3) buy a card, or 4) reserve a card and gain a gold token.",
        // helper:
        //   lang === "fa"
        //     ? "در مراحل بعد هر کدام از این کارها را جداگانه تمرین می‌کنید."
        //     : "You’ll practice each of these actions in the next steps.",
        cta: lang === "fa" ? "شروع حرکت‌ها" : "Start actions",
      },
      3: {
        title:
          lang === "fa"
            ? "1. گرفتن 3 ژتون متفاوت"
            : "1. Take 3 different tokens",
        body:
          lang === "fa"
            ? "در این مرحله به صورت خودکار یک الماس سفید، یک یاقوت آبی و یک زمرد سبز برداشته می‌شود تا این حرکت را ببینید."
            : "In this step the game will automatically take one diamond, one sapphire, and one emerald to demonstrate this action.",
        // helper:
        //   lang === "fa"
        //     ? "ژتون‌های درخشان را نگاه کنید، سپس روی «بعدی» بزنید."
        //     : "Watch the glowing tokens, then press Next.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      4: {
        title:
          lang === "fa"
            ? "2. خرید کارت با ژتون‌ها"
            : "2. Buy a card",
        body:
          lang === "fa"
            ? "کارت پایینِ سمت راست به صورت خودکار با سه ژتون برداشته‌شده خریداری می‌شود و یک پاداش قرمز دائمی می‌گیرید."
            : "The bottom-right card will be bought automatically using your three tokens, giving you a permanent red bonus.",
        // helper:
        //   lang === "fa"
        //     ? "کارت درخشان را نگاه کنید، سپس روی «بعدی» بزنید."
        //     : "Watch the glowing card, then press Next.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      5: {
        title:
          lang === "fa"
            ? "گرفتن ۲ ژتون هم‌رنگ"
            : "3. Take 2 same-color tokens",
        body:
          lang === "fa"
            ? "در این مرحله، دو ژتون قهوه‌ای (اونیكس) به صورت خودکار برداشته می‌شود تا قانون گرفتن دو ژتون هم‌رنگ را ببینید."
            : "In this step, two onyx tokens will be taken automatically to demonstrate taking two tokens of the same color.",
        // helper:
        //   lang === "fa"
        //     ? "به ژتون‌های قهوه‌ای درخشان نگاه کنید، سپس روی «بعدی» بزنید."
        //     : "Watch the glowing onyx tokens, then press Next.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      6: {
        title:
          lang === "fa"
            ? "خرید کارت بعدی"
            : "Buy the next card",
        body:
          lang === "fa"
            ? "کارت پایینِ سمت راست که به ۲ قرمز و ۲ قهوه‌ای نیاز دارد، به صورت خودکار با پاداش‌ها و ژتون‌های شما خریداری می‌شود."
            : "The bottom-right card, costing 2 red and 2 onyx, will be bought automatically using your bonuses and tokens.",
        // helper:
        //   lang === "fa"
        //     ? "کارت درخشان را نگاه کنید، سپس روی «بعدی» بزنید."
        //     : "Watch the glowing card, then press Next.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      7: {
        title:
          lang === "fa"
            ? "4. رزرو کردن کارت"
            : "4. Reserve a card",
        body:
          lang === "fa"
            ? "کارت مشخص‌شده به صورت خودکار برای شما رزرو می‌شود و یک ژتون طلا می‌گیرید که می‌تواند جای هر رنگی استفاده شود."
            : "The highlighted card will be reserved automatically for you, and you gain a gold token that can act as any color.",
        // helper:
        //   lang === "fa"
        //     ? "کارت درخشان و ژتون طلایی را نگاه کنید، سپس روی «بعدی» بزنید."
        //     : "Watch the glowing card and the gold token, then press Next.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      8: {
        title:
          lang === "fa"
            ? "نجیب‌ها"
            : "Nobles",
        body:
          lang === "fa"
            ? "وقتی با کارت‌های خود(نه ژتون ها)، شرایط یک نجیب را برآورده کنید، او خودکار به شما می‌پیوندد و امتیاز آن را به دست می آورید."
            : "When your cards (not tokens) meet a noble’s requirement, they join you automatically and give you points.",
        // helper:
        //   lang === "fa"
        //     ? "به نجیب درخشان در بالا نگاه کنید؛ وقتی شرایطش را داشته باشید خودکار به شما اضافه می‌شود."
            // : "Watch the glowing noble above; once you meet their requirement, they join you automatically.",
        cta: lang === "fa" ? "بعدی" : "Next",
      },
      9: {
        title:
          lang === "fa"
            ? "پایان بازی"
            : "End of the game",
        body:
          lang === "fa"
            ? "وقتی بازیکنی به ۱۵ امتیاز یا بیشتر برسد، دور آخر فعال می‌شود و پس از آن، هر کس بیشترین امتیاز را داشته باشد برنده است."
            : "When a player reaches 15 or more points, the final round triggers. After that round, the player with the most points wins.",
        cta: lang === "fa" ? "پایان آموزش" : "Finish Tutorial",
      },
    }),
    [lang],
  );

  // نجیب باید در استپ ۸ اتفاق بیفتد
  useEffect(() => {
    if (step !== 8 || nobleQueued) return;

    setNobleQueued(true);
    const timer = window.setTimeout(() => {
      setState((current) => {
        const player = current.players[0];
        const noble = current.nobles.find(
          (item) => item.id === TARGET_NOBLE_ID,
        );
        if (
          !noble ||
          player.nobles.some((item) => item.id === TARGET_NOBLE_ID)
        ) {
          return current;
        }

        const nextPlayers = [...current.players];
        nextPlayers[0] = {
          ...player,
          nobles: [...player.nobles, noble],
        };

        return {
          ...current,
          players: nextPlayers,
          nobles: current.nobles.filter(
            (item) => item.id !== TARGET_NOBLE_ID,
          ),
        };
      });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [nobleQueued, step]);

  const highlightedTokenTypes = useMemo<Array<GemType | "gold">>(() => {
    if (step === 3) return ["diamond", "sapphire", "emerald"];
    if (step === 5) return ["onyx"];
    return [];
  }, [step]);

  const highlightedCardIds = useMemo<Array<string | number>>(() => {
    if (step === 4) return [FIRST_CARD_ID];
    if (step === 6) return [SECOND_CARD_ID];
    if (step === 7) return [RESERVED_CARD_ID];
    return [];
  }, [step]);

  const updateTempPool = (nextSelected: GemType[]) => {
    if (!nextSelected.length) {
      setTempPoolDisplay(null);
      return;
    }

    const nextPool = { ...state.tokenPool };
    nextSelected.forEach((gem) => {
      nextPool[gem] = Math.max(0, nextPool[gem] - 1);
    });
    setTempPoolDisplay(nextPool);
  };

  useEffect(() => {
    return () => {
      flightTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const getElementCenter = useCallback((selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const spawnFlight = useCallback(
    (flight: Omit<TutorialFlightAnimation, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setFlightAnimations((current) => [...current, { ...flight, id }]);
      const timeoutId = window.setTimeout(() => {
        setFlightAnimations((current) => current.filter((item) => item.id !== id));
        flightTimeoutsRef.current = flightTimeoutsRef.current.filter(
          (item) => item !== timeoutId,
        );
      }, FLIGHT_DURATION_MS);
      flightTimeoutsRef.current.push(timeoutId);
    },
    [],
  );

  const animateTokensToPanel = useCallback(
    (gems: GemType[]) => {
      gems.forEach((gem) => {
        const start = getElementCenter(`[data-token-pool="${gem}"]`);
        const end = getElementCenter(`[data-player-token-slot="0-${gem}"]`);
        if (!start || !end) return;
        spawnFlight({
          kind: "token",
          start,
          end,
          imageUrl: gemTokenImages[gem],
        });
      });
    },
    [getElementCenter, spawnFlight],
  );

  const animateCardToPanel = useCallback(
    (card: Card, targetSelector: string) => {
      const start = getElementCenter(`[data-card-id="${String(card.id)}"]`);
      const end = getElementCenter(targetSelector);
      if (!start || !end) return;
      spawnFlight({
        kind: "card",
        start,
        end,
        imageUrl: undefined,
        color: "#0f172a",
        label: String(card.points || 0),
      });
    },
    [getElementCenter, spawnFlight],
  );

  // این‌ها الان عملاً برای این نسخه استفاده نمی‌شن، اما نگه داشته شده‌اند
  const handleGemClick = (gem: GemType) => {
    // در نسخه اتوماتیک، کلیک روی ژتون‌ها کاری انجام نمی‌دهد
    return;
  };

  const handleConfirmTokens = () => {
    // در نسخه اتوماتیک، گرفتن ژتون با دکمه بعدی انجام می‌شود
    return;
  };

  const handleCardClick = (card: Card) => {
    // در نسخه اتوماتیک، خرید/رزرو کارت با دکمه بعدی انجام می‌شود
    return;
  };

  const finishTutorial = () => {
    try {
      localStorage.setItem("splendor-tutorial-completed", "true");
      localStorage.removeItem("splendor-needs-tutorial");
    } catch (error) {
      console.error("Failed to save Splendor tutorial progress", error);
    }

    navigate(searchParams.get("returnTo") || defaultReturnPath);
  };

  const leaveTutorial = () => {
    navigate(searchParams.get("returnTo") || defaultReturnPath);
  };

  const getPlayerDisplayName = (index: number) => {
    if (index === 0) {
      return lang === "fa" ? "بازیکن ۱" : "Player 1";
    }
    return lang === "fa" ? "بازیکن ۲" : "Player 2";
  };

  // منطق جابه‌جا شدن استپ‌ها با انجام اتوماتیک اکشن‌ها
  const goToNextStep = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    // استپ ۳: خودکار گرفتن ۳ ژتون متفاوت
    if (step === 3) {
      const gems: GemType[] = ["diamond", "sapphire", "emerald"];
      animateTokensToPanel(gems);
      const nextState = performTakeTokens(state, gems);
      setState(nextState);
      setSelectedGems([]);
      setTempPoolDisplay(null);
      setStep(4);
      return;
    }

    // استپ ۴: خودکار خرید FIRST_CARD_ID
    if (step === 4) {
      const card = Object.values(state.visibleCards)
        .flat()
        .find((c) => c.id === FIRST_CARD_ID);
      if (card) {
        animateCardToPanel(card, `[data-player-bonus-slot="0-${card.gemBonus}"]`);
        const nextState = performPurchaseCard(state, card.id);
        setState(nextState);
      }
      setStep(5);
      return;
    }

    // استپ ۵: خودکار گرفتن ۲ ژتون اونیکس
    if (step === 5) {
      const gems: GemType[] = ["onyx", "onyx"];
      animateTokensToPanel(gems);
      const nextState = performTakeTokens(state, gems);
      setState(nextState);
      setSelectedGems([]);
      setTempPoolDisplay(null);
      setStep(6);
      return;
    }

    // استپ ۶: خودکار خرید SECOND_CARD_ID
    if (step === 6) {
      const card = Object.values(state.visibleCards)
        .flat()
        .find((c) => c.id === SECOND_CARD_ID);
      if (card) {
        animateCardToPanel(card, `[data-player-bonus-slot="0-${card.gemBonus}"]`);
        const nextState = performPurchaseCard(state, card.id);
        setState(nextState);
      }
      setStep(7);
      return;
    }

    // استپ ۷: خودکار رزرو کارت RESERVED_CARD_ID و گرفتن طلا
    if (step === 7) {
      setState((current) => {
        const player = current.players[0];
        const allVisibleCards = Object.values(current.visibleCards).flat();
        const card = allVisibleCards.find((c) => c.id === RESERVED_CARD_ID);
        if (!card) return current;

        const level = card.level;
        const nextVisible = { ...current.visibleCards };
        nextVisible[level] = nextVisible[level].filter((c) => c.id !== card.id);

        const nextPlayers = [...current.players];
        nextPlayers[0] = {
          ...player,
          reservedCards: [...player.reservedCards, card],
          tokens: {
            ...player.tokens,
            gold: player.tokens.gold + 1,
          },
        };

        return {
          ...current,
          players: nextPlayers,
          visibleCards: nextVisible,
        };
      });

      setStep(8);
      return;
    }

    if (step === 8) {
      setStep(9);
      return;
    }

    if (step === 9) {
      finishTutorial();
    }
  };

  const currentCTA = copy[step].cta;

  return (
    <SplendorGameShell
      dir={dir as "ltr" | "rtl"}
      backgroundImage={splendorBackground}
    >
      <div className="relative">
          <button
            type="button"
            onClick={leaveTutorial}
            className={`fixed top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-slate-950/80 text-slate-100 shadow-lg transition-colors hover:border-amber-300/70 hover:text-amber-100 ${dir === "rtl" ? "left-4" : "right-4"}`}
            aria-label={lang === "fa" ? "خروج از آموزش" : "Exit tutorial"}
          >
            <X className="h-5 w-5" />
          </button>
        <GameBoard
          t={t}
          state={state}
          currentPlayer={currentPlayer}
          panelCount={2}
          phase={"idle"}
          tempPoolDisplay={tempPoolDisplay}
          selectedGems={selectedGems}
          selectedCard={null}
          isAIPlayer={() => false}
          getPlayerDisplayName={getPlayerDisplayName}
          handleReturnToken={() => {}}
          handleReserveDeck={() => {}}
          handleCardClick={handleCardClick}
          handleGemClick={handleGemClick}
          handleConfirmTokens={handleConfirmTokens}
          handleCancel={() => {
            setSelectedGems([]);
            setTempPoolDisplay(null);
          }}
          backCardsByLevel={{
            1: backcard1Img,
            2: backcard2Img,
            3: backcard3Img,
          }}
          tutorialFocus={
            step === 3 || step === 5
              ? "tokens"
              : step === 4 || step === 6 || step === 7
              ? "card"
              : step === 8
              ? "nobles"
              : step === 1
              ? "card"
              : undefined
          }
          highlightedTokenTypes={highlightedTokenTypes}
          dimUnhighlightedTokens={step === 3 || step === 5}
          highlightedCardIds={highlightedCardIds}
          dimUnhighlightedCards={
            step === 1 || step === 4 || step === 6 || step === 7
          }
          highlightedNobleIds={step === 8 ? [TARGET_NOBLE_ID] : []}
          highlightReservedAreaForPlayerId={undefined}
          highlightedReservedCardIds={[]}
          highlightedPlayerTokenTypes={[]}
        />
        {flightAnimations.map((flight) => (
          <motion.div
            key={flight.id}
            className={
              flight.kind === "card"
                ? "pointer-events-none fixed z-[70] h-24 w-[4.5rem] overflow-hidden rounded-lg border border-white/40 bg-slate-900 text-center text-lg font-bold text-white shadow-xl md:h-28 md:w-20"
                : "pointer-events-none fixed z-[70] h-8 w-8 overflow-hidden rounded-full shadow-xl"
            }
            style={{
              left: flight.start.x - (flight.kind === "card" ? 36 : 16),
              top: flight.start.y - (flight.kind === "card" ? 48 : 16),
              backgroundColor: flight.color,
              backgroundImage: flight.imageUrl ? `url('${flight.imageUrl}')` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
            initial={{ x: 0, y: 0, scale: 0.95, opacity: 0.96 }}
            animate={{
              x: flight.end.x - flight.start.x,
              y: flight.end.y - flight.start.y,
              scale: flight.kind === "card" ? [0.95, 1.04, 0.72] : [0.95, 1.08, 0.9],
              opacity: [0.96, 1, 0.82],
            }}
            transition={{ duration: FLIGHT_DURATION_MS / 1000, ease: "easeInOut" }}
          >
            {flight.kind === "card" && !flight.imageUrl ? (
              <div className="flex h-full items-start justify-start p-2">
                <span className="rounded-full bg-black/80 px-2 py-1 text-xs">
                  {flight.label}
                </span>
              </div>
            ) : null}
          </motion.div>
        ))}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: step >= 7 ? 12 : -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={
            `fixed inset-x-0 z-40 mx-auto w-[min(94vw,40rem)] rounded-[26px]
             border border-amber-300/70 bg-slate-950
             p-5 shadow-[0_0_40px_rgba(251,191,36,0.25)] backdrop-blur
             ` +
            (step >= 8 ? " bottom-4" : " top-4")
          }
        >
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-amber-300 transition-all"
              style={{ width: `${((step + 1) / 10) * 100}%` }} // ۱۰ مرحله
            />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-amber-300/80">
                {/* {lang === "fa" ? `مرحله ${step + 1} از 10` : `Step ${step + 1} of 10`} */}
              </p>
              <h2 className="font-cinzel text-amber-100">
                {copy[step].title + ":"}
              </h2>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-100/92">
            {copy[step].body}
          </p>
          {copy[step].helper && (
            <p className="mt-2 text-xs text-amber-200/80">
              {copy[step].helper}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {currentCTA && (
              <Button onClick={goToNextStep}>
                {currentCTA}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </SplendorGameShell>
  );
}
