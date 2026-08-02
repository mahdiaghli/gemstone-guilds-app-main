import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type {
  DeadMansDrawCard,
  DeadMansDrawPendingEffect,
  DeadMansDrawRing,
  DeadMansDrawState,
  DeadMansDrawSuit,
} from "@/lib/deadMansDraw";
import { DEAD_MANS_DRAW_SUITS } from "@/lib/deadMansDraw";
import { CardChip } from "@/pages/dead-mans-draw/CardChip";
import { DeadMansDrawBoardView } from "@/pages/dead-mans-draw/DeadMansDrawBoardView";
import { PowerChoiceScreen } from "@/pages/dead-mans-draw/PowerChoiceScreen";

type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type TutorialCopy = {
  title: string;
  body: string;
  action?: string;
  lastAction: string;
};

const SCRIPTED = {
  oracle: { id: "tutorial-oracle", suit: "astrolabe", value: 7 } as DeadMansDrawCard,
  kraken: { id: "tutorial-kraken", suit: "snake", value: 5 } as DeadMansDrawCard,
  map: { id: "tutorial-map", suit: "map", value: 4 } as DeadMansDrawCard,
  chest: { id: "tutorial-chest", suit: "chest", value: 6 } as DeadMansDrawCard,
  burnKey: { id: "tutorial-burn-key", suit: "key", value: 5 } as DeadMansDrawCard,
  anchor: { id: "tutorial-anchor", suit: "carpet", value: 4 } as DeadMansDrawCard,
  cannon: { id: "tutorial-cannon", suit: "pistol", value: 8 } as DeadMansDrawCard,
  sword: { id: "tutorial-sword", suit: "dagger", value: 5 } as DeadMansDrawCard,
  hook: { id: "tutorial-hook", suit: "horseshoe", value: 6 } as DeadMansDrawCard,
  opponentOracle: { id: "opponent-oracle", suit: "astrolabe", value: 4 } as DeadMansDrawCard,
  opponentKey: { id: "opponent-key", suit: "key", value: 5 } as DeadMansDrawCard,
  opponentChest: { id: "opponent-chest", suit: "chest", value: 7 } as DeadMansDrawCard,
  coinA: { id: "tutorial-coin-a", suit: "coin", value: 6 } as DeadMansDrawCard,
  coinB: { id: "tutorial-coin-b", suit: "coin", value: 9 } as DeadMansDrawCard,
} as const;

const POWER_ORDER: DeadMansDrawRing[] = [
  "le-corsaire",
  "madam-margot",
  "ghallegar",
  "scurvy-pete",
  "zahara",
  "gunnie",
  "black-bonnie",
  "sir-lovesword",
  "seamus-quinn",
];

function createCollected() {
  return DEAD_MANS_DRAW_SUITS.reduce(
    (acc, suit) => {
      acc[suit] = [];
      return acc;
    },
    {} as Record<DeadMansDrawSuit, DeadMansDrawCard[]>
  );
}

function toCollected(cards: DeadMansDrawCard[]) {
  const collected = createCollected();
  cards.forEach((card) => {
    collected[card.suit] = [...collected[card.suit], card];
  });
  return collected;
}

function appendUnique(cards: DeadMansDrawCard[], card: DeadMansDrawCard) {
  return cards.some((entry) => entry.id === card.id) ? cards : [...cards, card];
}

const ENGLISH_COPY: Record<TutorialStep, TutorialCopy> = {
  1: {
    title: "Step 1: How the Game Works",
    body: "Players reveal cards from the deck. Each card has its own power, and if you reveal two cards of the same suit in one turn, the revealed cards burn and your turn ends.",
    lastAction: "Welcome to the tutorial. Learn the game flow before touching the deck.",
  },
  2: {
    title: "Step 2: Draw Deck, Collect Treasure, and Burn Pile",
    body: "Use the Collect Treasure button to bank the cards on the table. Use the button to its left to reveal a new card. The burn pile is where busted or discarded cards go.",
    lastAction: "Reveal the first tutorial card from the deck.",
  },
  3: {
    title: "Step 3: Oracle",
    body: "Oracle lets you see the next card before deciding whether to reveal it or collect your treasure.",
    lastAction: "Oracle has been revealed. Draw again to see the next card.",
  },
  4: {
    title: "Step 4: Kraken",
    body: "When Kraken is revealed, you must reveal two more cards.",
    lastAction: "Kraken is now in the treasure area. Continue when you are ready.",
  },
  5: {
    title: "Step 5: Map",
    body: "Map reveals the top three cards of the burn pile. You choose one of them and add it to your treasure.",
    lastAction: "Map has been revealed. Continue when you are ready.",
  },
  6: {
    title: "Step 6: Chest",
    body: "If Chest and Key are both in play, then when you collect your treasure, you gain bonus cards from the burn pile equal to the number of cards currently in the treasure area.",
    lastAction: "Chest has been revealed. Continue to learn how Anchor works.",
  },
  7: {
    title: "Step 7: Anchor",
    body: "Anchor protects the cards revealed before it. Even if you bust later by revealing two matching suits, the earlier cards are still safely collected.",
    action: "Click Collect Treasure to bank this hand.",
    lastAction: "Click Collect Treasure to save this hand.",
  },
  8: {
    title: "Step 8: Cannon",
    body: "Cannon lets you choose and destroy one card from your opponent.",
    action: "Choose one of the opponent's cards to use Cannon.",
    lastAction: "Cannon is ready. Destroy one of the opponent's cards.",
  },
  9: {
    title: "Step 9: Sword",
    body: "Sword takes one card from the opponent and moves it into the treasure area.",
    lastAction: "Sword has been revealed. Continue to see the special powers.",
  },
  10: {
    title: "Step 10: Hook",
    body: "Hook lets you bring one of your banked cards back into play.",
    lastAction: "Hook has been revealed. Continue to see the special powers.",
  },
  11: {
    title: "Step 11: Special Powers",
    body: "At the start of the main game, each player chooses one special power.",
    action: "Click a power to view its description, then continue.",
    lastAction: "Choose a special power to view its effect.",
  },
  12: {
    title: "Step 12: Score and Winning",
    body: "The values of the highest card of each suit are added together. The player with the higher total score wins. If the scores are tied, the player with more cards wins. Player panels display these scores, and clicking a portrait shows that player's special power.",
    action: "Finish the tutorial when you are ready.",
    lastAction: "You now know how scoring and winning work.",
  },
};

const PERSIAN_COPY: Record<TutorialStep, TutorialCopy> = {
  1: {
    title: "مرحله ۱: بازی چگونه کار می‌کند",
    body: "بازیکن‌ها از دسته کارت رو می‌کنند. هر کارت قدرت خودش را دارد و اگر در یک نوبت دو کارت هم‌شکل رو شود، کارت‌های رو شده می‌سوزند و نوبت بازیکن تمام می‌شود.",
    lastAction: "به آموزش خوش آمدید. قبل از لمس دسته، روند بازی را یاد بگیرید.",
  },
  2: {
    title: "مرحله ۲: دسته کارت، جمع گنج و پشته سوخته",
    body: "با دکمهٔ جمع‌کردن گنج، کارت‌های روی زمین برای شما ذخیره می‌شوند. با دکمهٔ سمت چپ آن، کارت جدید رو می‌کنید. پشتهٔ سوخته محل کارت‌های سوخته یا دورریخته است.",
    lastAction: "اولین کارت آموزشی را از دسته رو کنید.",
  },
  3: {
    title: "مرحله ۳: پیشگو",
    body: "پیشگو کارت بعدی را به شما نشان می‌دهد تا تصمیم بگیرید آن را رو کنید یا گنج خود را جمع کنید.",
    lastAction: "پیشگو رو شده است. دوباره بکشید تا کارت بعدی را ببینید.",
  },
  4: {
    title: "مرحله ۴: کراکن",
    body: "وقتی کراکن رو شود، باید دو کارت دیگر هم رو کنید.",
    lastAction: "کراکن در ناحیهٔ گنج قرار دارد. وقتی آماده بودید ادامه دهید.",
  },
  5: {
    title: "مرحله ۵: نقشه",
    body: "نقشه سه کارت بالایی پشتهٔ سوخته را رو می‌کند. شما یکی از آن‌ها را انتخاب می‌کنید و به گنج خود اضافه می‌کنید.",
    lastAction: "نقشه رو شده است. وقتی آماده بودید ادامه دهید.",
  },
  6: {
    title: "مرحله ۶: صندوقچه",
    body: "اگر صندوقچه و کلید هم‌زمان در زمین باشند، هنگام جمع‌کردن کارت‌ها، به تعداد کارت‌های ناحیهٔ گنج از پشتهٔ سوخته کارت جایزه می‌گیرید.",
    lastAction: "صندوقچه رو شده است. ادامه دهید تا نقش لنگر را ببینید.",
  },
  7: {
    title: "مرحله ۷: لنگر",
    body: "لنگر از کارت‌هایی که قبل از آن رو شده‌اند محافظت می‌کند. حتی اگر بعداً با رو شدن دو کارت هم‌شکل بسوزید.",
    // action: "برای ذخیره این دست، روی جمع گنج کلیک کنید.",
    lastAction: "برای ذخیره این دست، روی جمع گنج کلیک کنید.",
  },
  8: {
    title: "مرحله ۸: توپ",
    body: "با توپ می‌توانید یک کارت از حریف را انتخاب و نابود کنید.",
    // action: "برای استفاده از توپ، یکی از کارت‌های حریف را انتخاب کنید.",
    lastAction: "توپ آماده است. یکی از کارت‌های حریف را نابود کنید.",
  },
  9: {
    title: "مرحله ۹: شمشیر",
    body: "شمشیر یک کارت از حریف را انتخاب می‌کند و آن را وارد زمین بازی می‌کند. سکه هم امتیاز خالصه.",
    lastAction: "شمشیر رو شده است. برای دیدن قدرت‌های ویژه ادامه دهید.",
  },
  10: {
    title: "مرحله ۱۰: قلاب",
    body: "قلاب یکی از کارت‌های ذخیره‌شدهٔ شما را دوباره وارد بازی می‌کند.",
    lastAction: "قلاب رو شده است. برای دیدن قدرت‌های ویژه ادامه دهید.",
  },
  11: {
    title: "مرحله ۱۱: قدرت‌های ویژه",
    body: "در شروع بازی اصلی، هر بازیکن باید یک قدرت ویژه انتخاب کند.",
    // action: "روی یکی از قدرت‌ها کلیک کنید تا توضیح آن را ببینید، سپس ادامه دهید.",
    lastAction: "یکی از قدرت‌های ویژه را برای دیدن توضیح آن انتخاب کنید.",
  },
  12: {
    title: "مرحله آخر: برنده شدن",
    body: "امتیاز باارزش‌ترین کارت های هر شکل با هم جمع می‌شوند. بازیکنی که امتیاز کل بیشتری داشته باشد برنده است. اگر امتیازها برابر شوند، بازیکنی که کارت بیشتری دارد برنده می‌شود. با زدن روی عکس هر بازیکن می‌توانید قدرت ویژهٔ او را ببینید.",
    // action: "وقتی آماده بودید، آموزش را تمام کنید.",
    lastAction: "اکنون نحوهٔ امتیازدهی و برنده شدن را یاد گرفتید.",
  },
};

export default function DeadMansDrawTutorial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, t, dir } = useLanguage();
  const [step, setStep] = useState<TutorialStep>(1);
  const [revealedCards, setRevealedCards] = useState<DeadMansDrawCard[]>([]);
  const [playerBank, setPlayerBank] = useState<DeadMansDrawCard[]>([]);
  const [opponentCards, setOpponentCards] = useState<DeadMansDrawCard[]>([
    SCRIPTED.opponentOracle,
    SCRIPTED.opponentKey,
    SCRIPTED.opponentChest,
    SCRIPTED.coinA,
  ]);
  const [burnPile, setBurnPile] = useState<DeadMansDrawCard[]>([]);
  const [selectedTreasureHelpId, setSelectedTreasureHelpId] = useState<string | null>(null);
  const [selectedPower, setSelectedPower] = useState<DeadMansDrawRing | null>(null);

  const returnTo = searchParams.get("returnTo") || "/";
  const copy = (lang === "fa" ? PERSIAN_COPY : ENGLISH_COPY)[step];

  useEffect(() => {
    if (step !== 9) return;

    const coin = opponentCards.find((card) => card.suit === "coin");
    if (coin) {
      setOpponentCards((current) => current.filter((card) => card.id !== coin.id));
      setRevealedCards((current) => appendUnique(current, coin));
    }
  }, [step, opponentCards]);

  const mockPendingEffect = useMemo<DeadMansDrawPendingEffect | null>(() => {
    if (step !== 10) return null;

    return {
      kind: "horseshoe",
      sourceCardId: SCRIPTED.hook.id,
      options: playerBank,
      remaining: 1,
    } as DeadMansDrawPendingEffect;
  }, [step, playerBank]);

  const currentState = useMemo<DeadMansDrawState>(() => {
    const drawPile = Array.from(
      {
        length: Math.max(
          0,
          24 - revealedCards.length - playerBank.length - burnPile.length
        ),
      },
      (_, index) => ({
        id: `tutorial-draw-${index}`,
        suit: "coin" as DeadMansDrawSuit,
        value: 4,
      })
    );

    return {
      players: [
        {
          id: 0,
          collected: toCollected(playerBank),
          ringOptions: [],
          ring: selectedPower,
          markedOpponentIndex: null,
        },
        {
          id: 1,
          collected: toCollected(opponentCards),
          ringOptions: [],
          ring: null,
          markedOpponentIndex: null,
        },
      ],
      drawPile,
      discardPile: burnPile,
      treasureArea: revealedCards,
      currentPlayerIndex: 0,
      pendingEffect: mockPendingEffect,
      forcedRevealRemaining: 0,
      ringSelectionIndex: null,
      powerTargetSelection: null,
      protectedCardIds: [],
      protectedDrawRemaining: 0,
      lastAction: copy.lastAction,
      turnEndedBy: null,
      gameOver: false,
      winnerIndices: [],
    };
  }, [
    burnPile,
    copy.lastAction,
    mockPendingEffect,
    opponentCards,
    playerBank,
    revealedCards,
    selectedPower,
  ]);

  const highlightedTreasureIds = useMemo(() => {
    const ids = new Set<string>();
    const latestCard = revealedCards[revealedCards.length - 1];

    if (latestCard) ids.add(latestCard.id);
    return ids;
  }, [revealedCards]);

  const handleReveal = () => {
    if (step === 2) {
      setRevealedCards([SCRIPTED.oracle]);
      setStep(3);
      return;
    }

    if (step === 3) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.kraken));
      setStep(4);
    }
  };

  const handleCollect = () => {
    if (step !== 7) return;

    setPlayerBank(revealedCards);
    setRevealedCards([SCRIPTED.cannon]);
    setStep(8);
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2 || step === 3) {
      handleReveal();
      return;
    }

    if (step === 4) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.map));
      setStep(5);
      return;
    }

    if (step === 5) {
      setRevealedCards((current) =>
        appendUnique(appendUnique(current, SCRIPTED.burnKey), SCRIPTED.chest)
      );
      setStep(6);
      return;
    }

    if (step === 6) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.anchor));
      setStep(7);
      return;
    }

    if (step === 7) {
      handleCollect();
      return;
    }

    if (step === 8) {
      const targetCard = opponentCards[0];

      if (targetCard) {
        setOpponentCards((current) =>
          current.filter((card) => card.id !== targetCard.id)
        );
        setBurnPile((current) => [...current, targetCard]);
      }

      setRevealedCards((current) => appendUnique(current, SCRIPTED.sword));
      setStep(9);
      return;
    }

    if (step === 9) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.hook));
      setStep(10);
      return;
    }

    if (step === 10) {
      setStep(11);
      return;
    }

    if (step === 11) {
      setStep(12);
    }
  };

  const handleDaggerTarget = (
    targetPlayerIndex: number,
    suit: DeadMansDrawSuit
  ) => {
    if (step !== 5 || targetPlayerIndex !== 1 || suit !== "key") return;

    setRevealedCards((current) => appendUnique(current, SCRIPTED.chest));
    setStep(6);
  };

  const handlePistolTarget = (
    targetPlayerIndex: number,
    suit: DeadMansDrawSuit
  ) => {
    if (step !== 8 || targetPlayerIndex !== 1) return;

    const targetCard = opponentCards.find((card) => card.suit === suit);
    if (!targetCard) return;

    setOpponentCards((current) =>
      current.filter((card) => card.id !== targetCard.id)
    );
    setBurnPile((current) => [...current, targetCard]);
    setRevealedCards((current) => appendUnique(current, SCRIPTED.sword));
    setStep(9);
  };

  const getPlayerDisplayName = (index: number) => {
    if (index === 0) return lang === "fa" ? "بازیکن ۱" : "Player 1";
    return lang === "fa" ? "بازیکن ۲" : "Player 2";
  };

  const finishTutorial = () => {
    navigate(returnTo);
  };

  const progress = (step / 12) * 100;

  return (
    <div className={cn("relative", dir === "rtl" ? "font-persian" : "")}>
      <DeadMansDrawBoardView
        dir={dir as "rtl" | "ltr"}
        t={t}
        currentState={currentState}
        canReveal={step === 2 || step === 3}
        canCollect={step === 7}
        glowingDeck={step === 2 || step === 3}
        glowingCollect={step === 7}
        onReveal={handleReveal}
        onCollect={handleCollect}
        cardFlights={[]}
        visibleTreasureArea={revealedCards}
        highlightedTreasureIds={highlightedTreasureIds}
        selectedTreasureHelpId={selectedTreasureHelpId}
        onToggleTreasureHelp={(cardId) =>
          setSelectedTreasureHelpId((current) =>
            current === cardId ? null : cardId
          )
        }
        getPlayerDisplayName={getPlayerDisplayName}
        activePlayerIndex={0}
        pendingEffect={mockPendingEffect}
        decisionDisabled={false}
        onAstrolabeReveal={() => {}}
        onAstrolabeCollect={() => {}}
        onMapChoice={() => {}}
        onMisfireChoice={() => {}}
        onPistolTarget={handlePistolTarget}
        onDaggerTarget={handleDaggerTarget}
        onHorseshoeTarget={() => {}}
        targetSelectionDisabled={false}
        onOpenExit={() => navigate(returnTo)}
      />

      {step <= 10 && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-black/30" />
      )}

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed inset-x-0 top-4 z-50 mx-auto w-[min(94vw,34rem)] rounded-[28px] border border-amber-300/70 bg-[linear-gradient(180deg,rgba(120,53,15,0.95),rgba(45,18,8,0.96))] p-5 shadow-[0_0_44px_rgba(251,191,36,0.32),0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur"
        dir={dir}
      >
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2
          className={cn(
            "mb-3 mt-2 font-cinzel text-xl text-amber-100",
            dir === "rtl" ? "text-right" : "text-left"
          )}
        >
          {copy.title}
        </h2>

        <p
          className={cn(
            "text-sm leading-6 text-slate-100/92",
            dir === "rtl" ? "text-right" : "text-left"
          )}
        >
          {copy.body}
        </p>

        {copy.action && (
          <div
            className={cn(
              "mt-3 rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-2 text-sm text-teal-50/92",
              dir === "rtl" ? "text-right" : "text-left"
            )}
          >
            {copy.action}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {step <= 11 && (
            <Button onClick={handleContinue} className="pointer-events-auto">
              {lang === "fa" ? "ادامه" : "Continue"}
            </Button>
          )}

          {step === 12 && (
            <Button onClick={finishTutorial} className="pointer-events-auto">
              {lang === "fa" ? "پایان آموزش" : "Finish Tutorial"}
            </Button>
          )}
        </div>
      </motion.div>

      {step === 5 && (
        <div
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
          dir={dir}
        >
          <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-amber-300/40 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(5,8,18,0.96))] p-4 shadow-[0_24px_50px_rgba(2,6,23,0.55)] backdrop-blur-md">
            <p className="text-center font-cinzel text-sm uppercase tracking-[0.24em] text-amber-100/80">
              {lang === "fa" ? "گزینه‌های نقشه" : "Map Options"}
            </p>

            <div className="mt-3 flex justify-center gap-3">
              {[SCRIPTED.oracle, SCRIPTED.kraken, SCRIPTED.burnKey].map(
                (card) => (
                  <CardChip
                    key={card.id}
                    card={card}
                    compact
                    highlighted={false}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 11 Power Choice Screen (Right Aligned, No Overlay) */}
      {step === 11 ? (
<div className="pointer-events-none fixed inset-0 z-40 bg-black/30" >
          <div
            className={cn(
              "pointer-events-auto w-full max-w-4xl rounded-[24px] border border-fuchsia-300/25",
              "bg-[linear-gradient(180deg,rgba(10,16,28,0.96),rgba(5,8,18,0.96))]",
              "p-2.5 shadow-[0_18px_40px_rgba(2,6,23,0.55)] backdrop-blur-md",
              "origin-bottom scale-[0.6]"
            )}
          >
            <PowerChoiceScreen
              playerName={getPlayerDisplayName(0)}
              playerIndex={0}
              options={POWER_ORDER.slice(0, 2)}
              onSelect={(ring) => setSelectedPower(ring)}
              locked={false}
              t={t}
              // compact
            />
          </div>
        </div>
      ) : null}
      
    </div>
  );
}

