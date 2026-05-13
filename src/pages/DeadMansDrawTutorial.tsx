import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
import { POWER_VISUALS, getPowerAbilityKey } from "@/pages/dead-mans-draw/shared";


type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

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
  return DEAD_MANS_DRAW_SUITS.reduce((acc, suit) => {
    acc[suit] = [];
    return acc;
  }, {} as Record<DeadMansDrawSuit, DeadMansDrawCard[]>);
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

  const returnTo = searchParams.get("returnTo") || "/tutorial?game=dead-mans-draw";

  useEffect(() => {
    if (step === 9) {
      const coin = opponentCards.find(c => c.suit === 'coin');
      if (coin) {
        setOpponentCards(current => current.filter(c => c.id !== coin.id));
        setRevealedCards(current => appendUnique(current, coin));
      }
    }
  }, [step, opponentCards]);

  const copy = useMemo(() => {
    const en = {
      1: {
        title: "How Dead Man's Draw Works",
        body: "Players reveal cards from the draw deck, different suits trigger different powers, and your goal is to collect treasure before you bust and lose the haul.",
        action: "Read this overview, then continue.",
        lastAction: "Welcome to the tutorial. Learn the flow before you touch the deck.",
      },
      2: {
        title: "Step 2: Draw Deck, Collect Treasure, and Burn Pile",
        body: "The draw deck reveals the next card, Collect Treasure safely banks your haul, and the burn pile stores busted or discarded cards.",
        action: "Click the draw deck to reveal a card.",
        lastAction: "Reveal the first scripted card from the draw deck.",
      },
      3: {
        title: "Step 3: Oracle",
        body: "Oracle lets you see what is coming next before you commit. It gives you information so you can manage risk.",
        action: "Click the draw deck again to reveal the top card.",
        lastAction: "Oracle is revealed. Draw again to see the next scripted card.",
      },
      4: {
        title: "Step 4: Kraken",
        body: "Kraken increases pressure by forcing more action. Some suits immediately change how the turn continues.",
        action: "Acknowledge this explanation to continue.",
        lastAction: "Kraken is now in the treasure area. Continue when ready.",
      },
      5: {
        title: "Step 5: Map Options",
        body: "Map is revealed. Here are 3 options from the burn pile: oracle, kraken, key. You will not take the key from opponent. Click continue to reveal the key and go to next step.",
        action: "Click continue.",
        lastAction: "Map is revealed. Continue when ready.",
      },
      6: {
        title: "Step 6: Chest",
        body: "Chest becomes important when you also have Key. Together they create bonus value whenever the haul is safely collected.",
        action: "Continue when you understand the combo.",
        lastAction: "Chest is revealed. Continue to learn how Anchor protects the haul.",
      },
      7: {
        title: "Step 7: Anchor",
        body: "Anchor protects part of your haul and reduces risk. It is one of the tools that helps you push a turn a bit further.",
        action: "Click Collect Treasure to bank this scripted haul.",
        lastAction: "Click Collect Treasure to bank Oracle, Kraken, Chest, Anchor, and the selected Key.",
      },
      8: {
        title: "Step 8: Cannon",
        body: "Cannon destroys an opponent card. It is a direct attack and lets you remove important treasure from the other side.",
        action: "Click one opponent card to use Cannon.",
        lastAction: "Cannon is ready. Choose one opponent card to destroy.",
      },
      9: {
        title: "Step 9: Sword Power",
        body: "Sword is revealed. A coin card is automatically dragged from opponent. Click continue.",
        action: "Click continue.",
        lastAction: "Sword is revealed. Continue to view the special powers.",
      },
      10: {
        title: "Step 10: Hook",
        body: "Hook brings one of your banked cards back into the action, giving you flexibility from cards you already secured.",
        action: "Continue to the special powers lesson.",
        lastAction: "Hook is revealed. Continue to view the special powers.",
      },
      11: {
        title: "Step 11: Special Powers",
        body: "At the beginning of a full game, each player chooses one special power. Click a power to read what it does.",
        action: "Click at least one power, then finish the tutorial.",
        lastAction: "Choose a special power to inspect its ability.",
      },
    };

    const fa = {
      1: {
        title: "مرحله ۱: بازی چگونه کار می‌کند",
        body: "بازیکن‌ها از دسته کارت رو می‌کنند، هر خال قدرت خودش را دارد و هدف این است که قبل از ترکیدن، گنج را جمع کنید.",
        action: "این توضیح را بخوانید و ادامه دهید.",
        lastAction: "به آموزش خوش آمدید. قبل از لمس دسته، جریان بازی را یاد بگیرید.",
      },
      2: {
        title: "مرحله ۲: دسته کارت، جمع گنج و پشته سوخته",
        body: "دسته کارت، کارت بعدی را رو می‌کند؛ جمع گنج، دست فعلی شما را امن می‌کند؛ و پشته سوخته جای کارت‌های ترکیده یا دورریخته است.",
        action: "برای رو کردن کارت، روی دسته کلیک کنید.",
        lastAction: "اولین کارت آموزشی را از دسته رو کنید.",
      },
      3: {
        title: "مرحله ۳: اوراکل",
        body: "اوراکل به شما اطلاعات می‌دهد تا قبل از ادامه، بهتر درباره ریسک تصمیم بگیرید.",
        action: "دوباره روی دسته کارت کلیک کنید.",
        lastAction: "اوراکل رو شده است. دوباره بکشید تا کارت بعدی را ببینید.",
      },
      4: {
        title: "مرحله ۴: کراکن",
        body: "کراکن فشار نوبت را بیشتر می‌کند و نشان می‌دهد بعضی خال‌ها بلافاصله روند نوبت را عوض می‌کنند.",
        action: "توضیح را تایید کنید و ادامه دهید.",
        lastAction: "کراکن در ناحیه گنج قرار دارد. وقتی آماده بودید ادامه دهید.",
      },
      5: {
        title: "مرحله ۵: گزینه‌های نقشه",
        body: "نقشه رو شده است. اینجا ۳ گزینه از پشته سوخته است: اوراکل، کراکن، کلید. شما کلید را از حریف نمی‌گیرید. روی ادامه کلیک کنید تا کلید رو شود و به مرحله بعدی بروید.",
        action: "روی ادامه کلیک کنید.",
        lastAction: "نقشه رو شده است. وقتی آماده بودید ادامه دهید.",
      },
      6: {
        title: "مرحله ۶: صندوقچه",
        body: "صندوقچه وقتی همراه کلید باشد ارزش بیشتری پیدا می‌کند و هنگام جمع کردن، امتیاز جایزه می‌سازد.",
        action: "وقتی ترکیب را فهمیدید ادامه دهید.",
        lastAction: "صندوقچه رو شده است. ادامه دهید تا نقش لنگر را ببینید.",
      },
      7: {
        title: "مرحله ۷: لنگر",
        body: "لنگر بخشی از گنج شما را امن نگه می‌دارد و به شما کمک می‌کند با ریسک کنترل‌شده‌تر ادامه دهید.",
        action: "روی جمع گنج کلیک کنید تا این دست ذخیره شود.",
        lastAction: "برای ذخیره این دست، روی جمع گنج کلیک کنید.",
      },
      8: {
        title: "مرحله ۸: توپ",
        body: "توپ یک کارت از حریف را نابود می‌کند و یک حمله مستقیم به حساب می‌آید.",
        action: "برای استفاده از توپ، یکی از کارت‌های حریف را انتخاب کنید.",
        lastAction: "توپ آماده است. یکی از کارت‌های حریف را نابود کنید.",
      },
      9: {
        title: "مرحله ۹: قدرت شمشیر",
        body: "شمشیر رو شده است. یک کارت سکه به طور خودکار از حریف کشیده می‌شود. روی ادامه کلیک کنید.",
        action: "روی ادامه کلیک کنید.",
        lastAction: "شمشیر رو شده است. برای دیدن قدرت‌های ویژه ادامه دهید.",
      },
      10: {
        title: "مرحله ۱۰: قلاب",
        body: "قلاب یکی از کارت‌های ذخیره‌شدهٔ شما را دوباره وارد جریان بازی می‌کند و انعطاف زیادی می‌دهد.",
        action: "برای رفتن به بخش قدرت‌های ویژه ادامه دهید.",
        lastAction: "قلاب رو شده است. برای دیدن قدرت‌های ویژه ادامه دهید.",
      },
      11: {
        title: "مرحله ۱۱: قدرت‌های ویژه",
        body: "در شروع بازی اصلی، هر بازیکن باید یک قدرت ویژه انتخاب کند. روی یکی از آن‌ها کلیک کنید تا توضیحش را ببینید.",
        action: "حداقل روی یکی از قدرت‌ها کلیک کنید و بعد آموزش را تمام کنید.",
        lastAction: "یکی از قدرت‌های ویژه را برای دیدن توضیح آن انتخاب کنید.",
      },
    };

    return (lang === "fa" ? fa : en)[step];
  }, [lang, step]);

  const mockPendingEffect = useMemo<DeadMansDrawPendingEffect | null>(() => {
    if (step === 8) {
      return {
        kind: "pistol",
        sourceCardId: SCRIPTED.cannon.id,
        options: [{ playerIndex: 1, cards: opponentCards }],
      };
    }
    return null;
  }, [opponentCards, step]);

  const currentState = useMemo<DeadMansDrawState>(() => {
    const drawPile = Array.from({ length: Math.max(0, 24 - revealedCards.length - playerBank.length - burnPile.length) }, (_, index) => ({
      id: `tutorial-draw-${index}`,
      suit: "coin" as DeadMansDrawSuit,
      value: 4,
    }));

    return {
      players: [
        {
          id: 0,
          collected: toCollected(playerBank),
          ringOptions: [],
          ring: null,
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
  }, [burnPile, copy.lastAction, mockPendingEffect, opponentCards, playerBank, revealedCards]);

  const highlightedTreasureIds = useMemo(() => {
    const ids = new Set<string>();
    if (revealedCards.length) {
      ids.add(revealedCards[revealedCards.length - 1].id);
    }
    return ids;
  }, [revealedCards]);

  const restartTutorial = () => {
    setStep(1);
    setRevealedCards([]);
    setPlayerBank([]);
    setOpponentCards([SCRIPTED.opponentOracle, SCRIPTED.opponentKey, SCRIPTED.opponentChest, SCRIPTED.coinA]);
    setBurnPile([]);
    setSelectedTreasureHelpId(null);
    setSelectedPower(null);
  };

  const finishTutorial = () => {
    try {
      localStorage.setItem("deadmansdraw-tutorial-completed", "true");
    } catch {}
    navigate(returnTo);
  };

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

  const handleContinue = () => {
    if (step === 1) setStep(2);
    else if (step === 4) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.map));
      setStep(5);
    }
    else if (step === 5) {
      setRevealedCards((current) =>
        appendUnique(appendUnique(current, SCRIPTED.burnKey), SCRIPTED.chest),
      );
      setStep(6);
    }
    else if (step === 6) {
      setRevealedCards((current) => appendUnique(current, SCRIPTED.anchor));
      setStep(7);
    } else if (step === 9) setStep(10);
    else if (step === 10) setStep(11);
  }; 

  const handleCollect = () => {
    if (step !== 7) return;
    setPlayerBank(revealedCards);
    setRevealedCards([SCRIPTED.cannon]);
    setStep(8);
  }; 

  const handleDaggerTarget = (targetPlayerIndex: number, suit: DeadMansDrawSuit) => {
    if (step !== 5 || targetPlayerIndex !== 1 || suit !== "key") return;
    setRevealedCards((current) => appendUnique(current, SCRIPTED.chest));
    setStep(6);
  };

  const handlePistolTarget = (targetPlayerIndex: number, suit: DeadMansDrawSuit) => {
    if (step !== 8 || targetPlayerIndex !== 1) return;
    const targetCard = opponentCards.find((card) => card.suit === suit);
    if (!targetCard) return;
    setOpponentCards((current) => current.filter((card) => card.id !== targetCard.id));
    setBurnPile((current) => [...current, targetCard]);
    setRevealedCards((current) => appendUnique(current, SCRIPTED.sword));
    setStep(9);
  };

  const getPlayerDisplayName = (index: number) => {
    if (index === 0) return lang === "fa" ? "بازیکن ۱" : "Player 1";
    return lang === "fa" ? "بازیکن ۲" : "Player 2";
  };

  const progress = (step / 11) * 100;

  return (
      <div className={cn("relative", dir === "rtl" ? "font-persian" : "")}>
      <DeadMansDrawBoardView
        dir={dir as "rtl" | "ltr"}
        t={t}
        currentState={currentState}
        canReveal={step === 2 || step === 3}
        canCollect={step === 7}
        glowingDeck={step === 2}
        glowingCollect={step === 7}
        onReveal={handleReveal}
        onCollect={handleCollect}
        cardFlights={[]}
        visibleTreasureArea={revealedCards}
        highlightedTreasureIds={highlightedTreasureIds}
        selectedTreasureHelpId={selectedTreasureHelpId}
        onToggleTreasureHelp={(cardId) => setSelectedTreasureHelpId((current) => current === cardId ? null : cardId)}
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

      <div className="pointer-events-none fixed inset-0 z-40 bg-black/30" />
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed inset-x-0 top-4 z-50 mx-auto w-[min(94vw,34rem)] rounded-[28px] border border-amber-300/70 bg-[linear-gradient(180deg,rgba(120,53,15,0.95),rgba(45,18,8,0.96))] p-5 shadow-[0_0_44px_rgba(251,191,36,0.32),0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur"
      >

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} />
        </div>
                <div className="mb-3 flex items-start justify-between gap-3">
          
          <div>
            {/* <p className="text-xs uppercase tracking-[0.26em] text-amber-200/75">
              {lang === "fa" ? `مرحله ${step} از 11` : `Step ${step} of 11`}
            </p> */}
            <h2 className="mt-2 font-cinzel text-xl text-amber-100">{copy.title}</h2>
          </div>
          
          {/* <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button> */}
        </div>
        <p className="text-sm leading-6 text-slate-100/92">{copy.body}</p>
        <div className="mt-3 rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-2 text-sm text-teal-50/92">
          {copy.action}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {/* <Button variant="outline" onClick={restartTutorial} className="pointer-events-auto">
            <RotateCcw className="h-4 w-4" />
            {lang === "fa" ? "شروع دوباره" : "Restart"}
          </Button> */}
          {[1, 4, 5, 6, 9, 10].includes(step) ? (
            <Button onClick={handleContinue} className="pointer-events-auto">
              {lang === "fa" ? "ادامه" : "Continue"}
            </Button>
          ) : null}
          {step === 11 && selectedPower ? (
            <Button onClick={finishTutorial} className="pointer-events-auto">
              {lang === "fa" ? "پایان آموزش" : "Finish Tutorial"}
            </Button>
          ) : null}
        </div>
      </motion.div>

      {step === 5 ? (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-amber-300/40 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(5,8,18,0.96))] p-4 shadow-[0_24px_50px_rgba(2,6,23,0.55)] backdrop-blur-md">
            <p className="text-center font-cinzel text-sm uppercase tracking-[0.24em] text-amber-100/80">
              {lang === "fa" ? "گزینه‌های نقشه" : "Map Options"}
            </p>
            <div className="mt-3 flex justify-center gap-3">
              {[SCRIPTED.oracle, SCRIPTED.kraken, SCRIPTED.burnKey].map((card) => (
                <CardChip
                  key={card.id}
                  card={card}
                  compact
                  highlighted={false}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 11 ? (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-4xl rounded-[30px] border border-fuchsia-300/25 bg-[linear-gradient(180deg,rgba(10,16,28,0.96),rgba(5,8,18,0.96))] p-4 shadow-[0_24px_50px_rgba(2,6,23,0.55)] backdrop-blur-md">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {POWER_ORDER.map((ring) => {
                const visual = POWER_VISUALS[ring];
                return (
                  <button
                    key={ring}
                    type="button"
                    onClick={() => setSelectedPower(ring)}
                    className={`rounded-[24px] border p-3 text-left transition hover:-translate-y-1 ${selectedPower === ring ? "border-amber-300 bg-amber-400/10" : "border-white/10 bg-black/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={visual.character} alt={visual.label} className="h-16 w-16 rounded-2xl object-cover" />
                      <div>
                        <p className="font-cinzel text-amber-100">{visual.label}</p>
                        <p className="mt-1 text-xs text-white/70">{t(getPowerAbilityKey(ring))}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
