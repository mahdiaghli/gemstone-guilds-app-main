import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Crown, Sparkles, Swords, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { getGameMenuPath } from "@/lib/gameCatalog";
import type { GameProps } from "@/pages/game/gamePageUtils";

type GameMode = "local" | "ai" | "online";
type SymbolId = "sun" | "leaf" | "wave" | "moon" | "spark" | "stone";

type Card = {
  id: string;
  symbol: SymbolId;
  ownerIndex: number;
  tint: string;
};

type Player = {
  id: string;
  name: string;
  deck: Card[];
  wonPile: Card[];
};

type Challenge = {
  symbol: SymbolId;
  contenderIndices: number[];
};

type JungleSpeedState = {
  players: Player[];
  currentPlayerIndex: number;
  tableCards: Card[];
  challenge: Challenge | null;
  gameOver: boolean;
  winnerIndex: number | null;
  turn: number;
  lastAction: string;
};

const SYMBOLS: SymbolId[] = ["sun", "leaf", "wave", "moon", "spark", "stone"];
const EMOJIS: Record<SymbolId, string> = {
  sun: "☀️",
  leaf: "🍃",
  wave: "🌊",
  moon: "🌙",
  spark: "✦",
  stone: "🪨",
};
const LABELS: Record<SymbolId, { en: string; fa: string }> = {
  sun: { en: "Sun", fa: "خورشید" },
  leaf: { en: "Leaf", fa: "برگ" },
  wave: { en: "Wave", fa: "موج" },
  moon: { en: "Moon", fa: "ماه" },
  spark: { en: "Spark", fa: "جرقه" },
  stone: { en: "Stone", fa: "سنگ" },
};
const TINTS = [
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-cyan-600",
  "from-fuchsia-500 to-rose-500",
  "from-violet-500 to-indigo-600",
  "from-lime-400 to-green-600",
];

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createDeck(playerIndex: number): Card[] {
  return shuffle(
    SYMBOLS.flatMap((symbol, index) => [
      { id: `${playerIndex}-${symbol}-a`, symbol, ownerIndex: playerIndex, tint: TINTS[index % TINTS.length] },
      { id: `${playerIndex}-${symbol}-b`, symbol, ownerIndex: playerIndex, tint: TINTS[(index + playerIndex + 1) % TINTS.length] },
    ]),
  );
}

function cloneState(state: JungleSpeedState): JungleSpeedState {
  return structuredClone(state);
}

function createInitialState(playerNames: string[]): JungleSpeedState {
  return {
    players: playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      deck: createDeck(index),
      wonPile: [],
    })),
    currentPlayerIndex: 0,
    tableCards: [],
    challenge: null,
    gameOver: false,
    winnerIndex: null,
    turn: 1,
    lastAction: "Game started.",
  };
}

function nextPlayerIndex(state: JungleSpeedState, fromIndex: number) {
  for (let step = 1; step <= state.players.length; step += 1) {
    const index = (fromIndex + step) % state.players.length;
    if (state.players[index]?.deck.length > 0) return index;
  }
  return fromIndex;
}

function revealNext(state: JungleSpeedState, lang: "en" | "fa"): JungleSpeedState {
  const nextState = cloneState(state);
  if (nextState.gameOver || nextState.challenge) return state;
  const player = nextState.players[nextState.currentPlayerIndex];
  if (!player || player.deck.length === 0) return state;

  const card = player.deck.shift()!;
  nextState.tableCards.push(card);
  nextState.lastAction =
    lang === "fa"
      ? `${player.name} کارت ${LABELS[card.symbol].fa} را رو کرد.`
      : `${player.name} revealed ${LABELS[card.symbol].en}.`;

  const matches = nextState.tableCards.filter((entry) => entry.symbol === card.symbol);
  if (matches.length >= 2) {
    nextState.challenge = {
      symbol: card.symbol,
      contenderIndices: [...new Set(matches.map((entry) => entry.ownerIndex))],
    };
    nextState.lastAction =
      lang === "fa"
        ? `نماد ${LABELS[card.symbol].fa} تکرار شد؛ توتم را بگیر!`
        : `${LABELS[card.symbol].en} matched — grab the totem!`;
    return nextState;
  }

  if (player.deck.length === 0) {
    nextState.gameOver = true;
    nextState.winnerIndex = nextState.currentPlayerIndex;
    nextState.lastAction =
      lang === "fa" ? `${player.name} همه کارت‌هایش را تمام کرد.` : `${player.name} ran out of cards.`;
    return nextState;
  }

  nextState.currentPlayerIndex = nextPlayerIndex(nextState, nextState.currentPlayerIndex);
  nextState.turn += 1;
  return nextState;
}

function grabTotem(state: JungleSpeedState, playerIndex: number, lang: "en" | "fa"): JungleSpeedState {
  const nextState = cloneState(state);
  if (nextState.gameOver) return state;

  if (!nextState.challenge) {
    nextState.players[playerIndex].deck.push(...nextState.tableCards);
    nextState.tableCards = [];
    nextState.lastAction =
      lang === "fa"
        ? `${nextState.players[playerIndex].name} اشتباه توتم را گرفت و کارت‌ها را برداشت.`
        : `${nextState.players[playerIndex].name} grabbed too early and took the table cards.`;
  } else if (!nextState.challenge.contenderIndices.includes(playerIndex)) {
    nextState.players[playerIndex].deck.push(...nextState.tableCards);
    nextState.tableCards = [];
    nextState.lastAction =
      lang === "fa"
        ? `${nextState.players[playerIndex].name} در دوئل نبود و جریمه شد.`
        : `${nextState.players[playerIndex].name} was not part of the duel and got penalized.`;
  } else {
    nextState.players[playerIndex].wonPile.push(...nextState.tableCards);
    nextState.tableCards = [];
    nextState.lastAction =
      lang === "fa"
        ? `${nextState.players[playerIndex].name} نبرد توتم را برد.`
        : `${nextState.players[playerIndex].name} won the totem battle.`;
  }

  nextState.challenge = null;
  nextState.currentPlayerIndex = nextPlayerIndex(nextState, nextState.currentPlayerIndex);
  nextState.turn += 1;
  return nextState;
}

function getAIDelay(difficulty: "easy" | "medium" | "hard") {
  return difficulty === "easy" ? 900 : difficulty === "medium" ? 600 : 300;
}

function CardView({ card, lang }: { card: Card; lang: "en" | "fa" }) {
  return (
    <div className={`relative flex h-32 w-24 flex-col items-center justify-between overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-br ${card.tint} p-3 shadow-[0_18px_50px_rgba(2,6,23,0.45)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_48%)]" />
      <span className="relative text-3xl">{EMOJIS[card.symbol]}</span>
      <span className="relative text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
        {LABELS[card.symbol][lang]}
      </span>
    </div>
  );
}

export default function JungleSpeedGame(props: GameProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, dir } = useLanguage();

  const mode = (props.mode || searchParams.get("mode") || "local") as GameMode;
  const playerCount = Math.min(6, Math.max(2, parseInt(searchParams.get("players") || "4", 10)));
  const humanPlayerCount = Math.min(playerCount, Math.max(1, parseInt(searchParams.get("humans") || (mode === "ai" ? "1" : String(playerCount)), 10)));
  const aiDifficulty = ((searchParams.get("difficulty") || "medium") as "easy" | "medium" | "hard");

  const playerNames = useMemo(() => {
    return Array.from({ length: playerCount }, (_, index) => {
      if (mode === "online") return props.playerNamesList?.[index] || `Player ${index + 1}`;
      if (mode === "ai" && index !== 0) return `${lang === "fa" ? "ربات" : "AI"} ${index}`;
      return index === 0 ? (lang === "fa" ? "شما" : "You") : `${lang === "fa" ? "بازیکن" : "Player"} ${index + 1}`;
    });
  }, [lang, mode, playerCount, props.playerNamesList]);
  const initialState = useMemo(() => createInitialState(playerNames), [playerNames]);

  const [localState, setLocalState] = useState<JungleSpeedState>(initialState);
  const currentState = mode === "online" && props.serverGameState ? (props.serverGameState as unknown as JungleSpeedState) : localState;
  const aiTimerRef = useRef<number | null>(null);
  const localPlayerIndex = props.playerIndex ?? 0;

  useEffect(() => {
    if (mode !== "online") {
      setLocalState(initialState);
    }
  }, [initialState, mode]);

  useEffect(() => {
    if (mode === "online" && props.serverGameState) {
      setLocalState(props.serverGameState as unknown as JungleSpeedState);
    }
  }, [mode, props.serverGameState]);

  const applyState = useCallback((nextState: JungleSpeedState) => {
    const cloned = cloneState(nextState);
    if (mode === "online") props.onGameStateChange?.(cloned as any);
    setLocalState(cloned);
  }, [mode, props]);

  const isAIPlayer = useCallback((index: number) => {
    if (mode === "ai") return index !== 0;
    if (mode === "local") return index >= humanPlayerCount;
    return false;
  }, [humanPlayerCount, mode]);

  const handleReveal = useCallback(() => {
    applyState(revealNext(currentState, lang));
  }, [applyState, currentState, lang]);

  const handleGrabTotem = useCallback(() => {
    const actorIndex = mode === "online" ? localPlayerIndex : currentState.currentPlayerIndex;
    applyState(grabTotem(currentState, actorIndex, lang));
  }, [applyState, currentState, lang, localPlayerIndex, mode]);

  useEffect(() => {
    if (mode === "online" || currentState.gameOver || aiTimerRef.current !== null) return;
    if (!isAIPlayer(currentState.currentPlayerIndex)) return;

    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (currentState.challenge) {
        applyState(grabTotem(currentState, currentState.currentPlayerIndex, lang));
        return;
      }
      applyState(revealNext(currentState, lang));
    }, currentState.challenge ? getAIDelay(aiDifficulty) : 850);

    return () => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [aiDifficulty, applyState, currentState, isAIPlayer, lang, mode]);

  const menuPath = getGameMenuPath("totem");
  const canReveal = !currentState.gameOver && !currentState.challenge && (mode === "online" ? currentState.currentPlayerIndex === localPlayerIndex : !isAIPlayer(currentState.currentPlayerIndex));
  const winnerName = currentState.winnerIndex !== null ? currentState.players[currentState.winnerIndex]?.name : "";

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(234,179,8,0.16),_transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.96))]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4">
        <div className="mb-5 flex items-center justify-between rounded-[30px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl">
          <Button variant="ghost" onClick={() => navigate(menuPath)} className="rounded-full border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang === "fa" ? "بازگشت" : "Back"}
          </Button>
          <div className="text-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "fa" ? "بازی سرعتی" : "Reaction Duel"}
            </div>
            <h1 className="font-cinzel text-2xl text-emerald-50 sm:text-4xl">Jungle Speed</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
            <span className="mr-2 inline-flex items-center gap-1 text-amber-200">
              <Crown className="h-4 w-4" />
              {lang === "fa" ? "نوبت" : "Turn"}
            </span>
            {currentState.turn}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[34px] border border-white/10 bg-slate-950/35 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">{lang === "fa" ? "میدان" : "Arena"}</p>
                <p className="mt-2 text-sm text-slate-100/85">{currentState.lastAction}</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
                {currentState.challenge ? (lang === "fa" ? "دوئل" : "Duel") : (lang === "fa" ? "آماده" : "Ready")}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.75),rgba(2,6,23,0.95))] p-5">
              <div className="flex min-h-[240px] flex-wrap items-center justify-center gap-4">
                <AnimatePresence>
                  {currentState.tableCards.length ? currentState.tableCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 18, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotate: index % 2 === 0 ? -4 : 4 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CardView card={card} lang={lang} />
                    </motion.div>
                  )) : (
                    <div className="rounded-[24px] border border-dashed border-white/15 px-6 py-10 text-center text-slate-300/70">
                      {lang === "fa" ? "کارت‌ها اینجا ظاهر می‌شوند" : "Revealed cards appear here"}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  onClick={handleGrabTotem}
                  disabled={currentState.gameOver}
                  className="h-16 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-8 text-base font-bold text-white shadow-[0_18px_50px_rgba(249,115,22,0.42)] hover:scale-[1.02]"
                >
                  <Swords className="mr-2 h-5 w-5" />
                  {currentState.challenge ? (lang === "fa" ? "گرفتن توتم" : "Grab Totem") : (lang === "fa" ? "توتم" : "Totem")}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">{lang === "fa" ? "بازیکنان" : "Players"}</p>
              <div className="mt-4 space-y-3">
                {currentState.players.map((player, index) => (
                  <div key={player.id} className={`rounded-2xl border px-4 py-3 ${index === currentState.currentPlayerIndex ? "border-emerald-300/50 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-sm text-white">{player.name}</span>
                      <span className="text-xs text-slate-200/70">{player.deck.length}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/20">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300"
                          style={{ width: `${Math.max(8, (player.deck.length / 12) * 100)}%` }}
                        />
                      </div>
                      {index === currentState.currentPlayerIndex ? <Zap className="h-4 w-4 text-amber-300" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">{lang === "fa" ? "قوانین کوتاه" : "Quick Rules"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-100/85">
                {lang === "fa"
                  ? "هر بازیکن یک کارت رو می‌کند. اگر دو نماد یکی شوند، بازیکنان درگیر باید سریع‌تر از بقیه توتم را بگیرند."
                  : "Players reveal one card at a time. When two symbols match, the involved players race for the totem."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {canReveal ? (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <Button onClick={handleReveal} className="rounded-full bg-white/10 px-6 py-3 text-white backdrop-blur-xl hover:bg-white/15">
            {lang === "fa" ? "رو کردن کارت" : "Reveal Card"}
          </Button>
        </div>
      ) : null}

      {currentState.gameOver ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-[34px] border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_30px_90px_rgba(2,6,23,0.7)] backdrop-blur-2xl">
            <Crown className="mx-auto mb-4 h-14 w-14 text-amber-300" />
            <h2 className="font-cinzel text-3xl text-white">{lang === "fa" ? "بازی تمام شد" : "Game Over"}</h2>
            <p className="mt-3 text-slate-200/85">
              {winnerName ? `${winnerName} ${lang === "fa" ? "برنده شد" : "wins"}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
