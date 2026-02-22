export type GemType = 'diamond' | 'sapphire' | 'emerald' | 'ruby' | 'onyx';
export type TokenType = GemType | 'gold';

export const GEM_TYPES: GemType[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];
export const TOKEN_TYPES: TokenType[] = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx', 'gold'];

export interface Card {
  id: number;
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
  gameOver: boolean;
  winner: number | null;
}

export const GEM_INFO: Record<GemType | 'gold', { name: string; color: string; bgColor: string; darkColor: string }> = {
  diamond:  { name: 'Diamond',  color: '#e2e8f0', bgColor: 'rgba(226,232,240,0.15)', darkColor: '#94a3b8' },
  sapphire: { name: 'Sapphire', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)',  darkColor: '#1d4ed8' },
  emerald:  { name: 'Emerald',  color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)',   darkColor: '#15803d' },
  ruby:     { name: 'Ruby',     color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)',   darkColor: '#b91c1c' },
  onyx:     { name: 'Onyx',     color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)', darkColor: '#475569' },
  gold:     { name: 'Gold',     color: '#eab308', bgColor: 'rgba(234,179,8,0.15)',   darkColor: '#a16207' },
};

export const LEVEL_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#eab308',
  3: '#3b82f6',
};

// Card generation using rotational patterns
function createLevelCards(level: 1 | 2 | 3, patterns: [number, number, number, number, number][]): Card[] {
  let id = level * 1000;
  const cards: Card[] = [];
  for (const gem of GEM_TYPES) {
    const others = GEM_TYPES.filter(g => g !== gem);
    for (const [pts, a, b, c, d] of patterns) {
      const cost: Partial<Record<GemType, number>> = {};
      if (a > 0) cost[others[0]] = a;
      if (b > 0) cost[others[1]] = b;
      if (c > 0) cost[others[2]] = c;
      if (d > 0) cost[others[3]] = d;
      cards.push({ id: id++, level, gemBonus: gem, points: pts, cost });
    }
  }
  return cards;
}

export const ALL_CARDS: Card[] = [
  ...createLevelCards(1, [
    [0, 1, 1, 1, 1],
    [0, 1, 2, 1, 1],
    [0, 2, 2, 0, 1],
    [0, 3, 0, 0, 0],
    [0, 0, 0, 2, 1],
    [0, 2, 0, 0, 2],
    [0, 0, 4, 0, 0],
    [1, 0, 0, 0, 4],
  ]),
  ...createLevelCards(2, [
    [1, 3, 2, 2, 0],
    [1, 2, 3, 0, 3],
    [2, 0, 0, 4, 2],
    [2, 0, 5, 0, 0],
    [2, 5, 3, 0, 0],
    [3, 6, 0, 0, 0],
  ]),
  ...createLevelCards(3, [
    [3, 3, 3, 5, 3],
    [4, 0, 7, 0, 0],
    [4, 3, 6, 3, 0],
    [5, 0, 7, 3, 0],
  ]),
];

export const ALL_NOBLES: Noble[] = [
  { id: 1, points: 3, requirements: { diamond: 4, sapphire: 4 } },
  { id: 2, points: 3, requirements: { emerald: 4, ruby: 4 } },
  { id: 3, points: 3, requirements: { onyx: 4, diamond: 4 } },
  { id: 4, points: 3, requirements: { sapphire: 4, emerald: 4 } },
  { id: 5, points: 3, requirements: { diamond: 3, sapphire: 3, emerald: 3 } },
  { id: 6, points: 3, requirements: { sapphire: 3, emerald: 3, ruby: 3 } },
  { id: 7, points: 3, requirements: { emerald: 3, ruby: 3, onyx: 3 } },
  { id: 8, points: 3, requirements: { ruby: 3, onyx: 3, diamond: 3 } },
  { id: 9, points: 3, requirements: { onyx: 3, diamond: 3, sapphire: 3 } },
  { id: 10, points: 3, requirements: { diamond: 3, emerald: 3, onyx: 3 } },
];
