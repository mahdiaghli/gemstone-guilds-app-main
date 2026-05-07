import splendorCardsData from "@/components/game/cards-Splendor.json";

export type GemType = 'diamond' | 'sapphire' | 'emerald' | 'ruby' | 'onyx';
export type TokenType = GemType | 'gold';

export const GEM_TYPES: GemType[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];
export const TOKEN_TYPES: TokenType[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx', 'gold'];

export interface Card {
  id: string | number;
  level: 1 | 2 | 3;
  gemBonus: GemType;
  points: number;
  cost: Partial<Record<GemType, number>>;
}

export interface Noble {
  id: number;
  points: number;
  requirements: Partial<Record<GemType, number>>;
}

export interface Player {
  id: number;
  name?: string; // Optional: player name from lobby (for online games)
  tokens: Record<TokenType, number>;
  cards: Card[];
  reservedCards: Card[];
  nobles: Noble[];
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  tokenPool: Record<TokenType, number>;
  decks: { 1: Card[]; 2: Card[]; 3: Card[] };
  visibleCards: { 1: (Card | null)[]; 2: (Card | null)[]; 3: (Card | null)[] };
  nobles: Noble[];
  isLastRound: boolean;
  lastRoundTriggerIndex: number | null;
  gameOver: boolean;
  winner: number | null;
}

export const GEM_INFO: Record<GemType | 'gold', { name: string; color: string; bgColor: string; darkColor: string }> = {
  diamond:  { name: 'Diamond',  color: '#ffffff', bgColor: 'rgba(226,232,240,0.15)', darkColor: '#919191' },
  sapphire: { name: 'Sapphire', color: '#222dff', bgColor: 'rgba(59,130,246,0.15)',  darkColor: '#1d4ed8' },
  emerald:  { name: 'Emerald',  color: '#00c32a', bgColor: 'rgba(34,197,94,0.15)',   darkColor: '#0fc937' },
  ruby:     { name: 'Ruby',     color: '#ff0000', bgColor: 'rgba(239,68,68,0.15)',   darkColor: '#b91c1c' },
  // Make "onyx" look clearly brown/bronze to be more distinguishable
  onyx:     { name: 'Onyx',     color: '#8B4513', bgColor: 'rgba(139,69,19,0.18)', darkColor: '#654321' },
  gold:     { name: 'Gold',     color: '#eab308', bgColor: 'rgba(234,179,8,0.15)',   darkColor: '#ffffff' },
};

export const LEVEL_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#eab308',
  3: '#3b82f6',
};

const CARD_COLOR_TO_GEM: Record<string, GemType> = {
  white: "diamond",
  blue: "sapphire",
  green: "emerald",
  red: "ruby",
  black: "onyx",
};

type SplendorJsonCard = {
  id: string | number;
  level: 1 | 2 | 3;
  color: string;
  points: number;
  cost: Record<string, number>;
};

type SplendorJsonNoble = {
  id: string | number;
  points: number;
  requirement?: Record<string, number>;
  requirements?: Record<string, number>;
};

function normalizeCardCost(rawCost: Record<string, number>): Partial<Record<GemType, number>> {
  const cost: Partial<Record<GemType, number>> = {};
  for (const [color, amount] of Object.entries(rawCost || {})) {
    const gem = CARD_COLOR_TO_GEM[color];
    if (gem && amount > 0) {
      cost[gem] = amount;
    }
  }
  return cost;
}

function isSplendorCard(entry: unknown): entry is SplendorJsonCard {
  return Boolean(
    entry &&
    typeof entry === "object" &&
    "level" in entry &&
    "color" in entry &&
    "cost" in entry,
  );
}

function isSplendorNoble(entry: unknown): entry is SplendorJsonNoble {
  return Boolean(
    entry &&
    typeof entry === "object" &&
    "points" in entry &&
    ("requirement" in entry || "requirements" in entry) &&
    !("level" in entry),
  );
}

function normalizeNobleRequirements(rawRequirements: Record<string, number>): Partial<Record<GemType, number>> {
  const requirements: Partial<Record<GemType, number>> = {};
  for (const [color, amount] of Object.entries(rawRequirements || {})) {
    const gem = CARD_COLOR_TO_GEM[color];
    if (gem && amount > 0) {
      requirements[gem] = amount;
    }
  }
  return requirements;
}

const rawCardEntries: SplendorJsonCard[] = [
  ...((splendorCardsData.cards || []) as unknown[]).filter(isSplendorCard),
  ...((splendorCardsData.nobles || []) as unknown[]).filter(isSplendorCard),
];

const rawNobleEntries = ((splendorCardsData.nobles || []) as unknown[]).filter(isSplendorNoble);

export const ALL_CARDS: Card[] = rawCardEntries.map((card) => ({
  id: card.id,
  level: card.level as 1 | 2 | 3,
  gemBonus: CARD_COLOR_TO_GEM[card.color],
  points: card.points,
  cost: normalizeCardCost(card.cost),
}));

export const ALL_NOBLES: Noble[] = rawNobleEntries.map((noble, index) => ({
  id: typeof noble.id === "number" ? noble.id : index + 1,
  points: noble.points,
  requirements: normalizeNobleRequirements(
    noble.requirement || noble.requirements || {},
  ),
}));
