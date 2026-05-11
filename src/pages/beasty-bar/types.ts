// Beasty Bar - Types and Game Logic

export type AnimalType =
  | "lion"
  | "hippopotamus"
  | "crocodile"
  | "snake"
  | "giraffe"
  | "zebra"
  | "beaver"
  | "chameleon"
  | "monkey"
  | "kangaroo"
  | "parrot"
  | "binturong";

export interface AnimalCard {
  id: string;
  type: AnimalType;
  power: number;
  ownerIndex: number;
  isRepeatable: boolean;
  copiedType?: AnimalType; // For chameleon
}

export type PlayerColor = "red" | "blue" | "green" | "yellow";

export interface BeastyBarPlayer {
  id: string;
  index: number;
  color: PlayerColor;
  name: string;
  hand: AnimalCard[];
  drawStack: AnimalCard[]; // Face down cards
  wildCafe: AnimalCard[]; // Animals that entered the cafe
  thatsIt: AnimalCard[]; // Exiled animals
  totalCards: number; // Total cards played (for end game detection)
}

export type GamePhase =
  | "waiting"
  | "playing"
  | "resolvingAbility"
  | "resolvingRepeatable"
  | "checkingGate"
  | "ended";

export interface BumpingZoneState {
  animals: AnimalCard[];
  maxSize: number;
  heavenGateDirection: "normal" | "reversed"; // Beaver can swap
}

export interface BeastyBarGameState {
  players: BeastyBarPlayer[];
  currentPlayerIndex: number;
  bumpingZone: BumpingZoneState;
  phase: GamePhase;
  turn: number;
  gameOver: boolean;
  winnerIndices: number[];
  lastAction: string;
  pendingEffect: PendingEffect | null;
}

export type PendingEffect =
  | { kind: "chameleon"; playerIndex: number; targetOptions: AnimalCard[] }
  | { kind: "kangaroo"; playerIndex: number; jumpOptions: number[] } // 1 or 2
  | { kind: "parrot"; playerIndex: number; targetOptions: AnimalType[]; fromSpeciesInZone: AnimalType[] };

export const ANIMAL_DEFINITIONS: Record<
  AnimalType,
  { power: number; isRepeatable: boolean; count: number }
> = {
  lion: { power: 12, isRepeatable: false, count: 1 },
  hippopotamus: { power: 11, isRepeatable: true, count: 2 },
  crocodile: { power: 10, isRepeatable: true, count: 2 },
  snake: { power: 9, isRepeatable: false, count: 2 },
  giraffe: { power: 8, isRepeatable: true, count: 2 },
  zebra: { power: 7, isRepeatable: true, count: 2 },
  beaver: { power: 6, isRepeatable: false, count: 2 },
  chameleon: { power: 5, isRepeatable: false, count: 2 },
  monkey: { power: 4, isRepeatable: false, count: 2 },
  kangaroo: { power: 3, isRepeatable: false, count: 2 },
  parrot: { power: 2, isRepeatable: false, count: 2 },
  binturong: { power: 1, isRepeatable: false, count: 1 },
};

export const PLAYER_COLORS: PlayerColor[] = ["blue", "red", "yellow", "green"];

export const ANIMAL_NAMES: Record<AnimalType, { en: string; fa: string }> = {
  lion: { en: "Lion", fa: "شیر" },
  hippopotamus: { en: "Hippopotamus", fa: "اسب آبی" },
  crocodile: { en: "Crocodile", fa: "تمساح" },
  snake: { en: "Snake", fa: "مار" },
  giraffe: { en: "Giraffe", fa: "زرافه" },
  zebra: { en: "Zebra", fa: "گورخر" },
  beaver: { en: "Beaver", fa: "سگ آبی" },
  chameleon: { en: "Chameleon", fa: "آفتاب‌پرست" },
  monkey: { en: "Monkey", fa: "میمون" },
  kangaroo: { en: "Kangaroo", fa: "کانگرو" },
  parrot: { en: "Parrot", fa: "طوطی" },
  binturong: { en: "Binturong", fa: "گربه زباد" },
};

export function createAnimalDeck(playerIndex: number, color: PlayerColor): AnimalCard[] {
  const deck: AnimalCard[] = [];

  // Each player gets exactly 1 of each of the 12 animal types (points 1-12)
  (Object.keys(ANIMAL_DEFINITIONS) as AnimalType[]).forEach((type) => {
    const def = ANIMAL_DEFINITIONS[type];
    deck.push({
      id: `${color}-${type}-${playerIndex}`,
      type,
      power: def.power,
      ownerIndex: playerIndex,
      isRepeatable: def.isRepeatable,
    });
  });

  return shuffle(deck);
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGameState(
  playerCount: number,
  humanPlayerCount: number,
  playerNames: string[]
): BeastyBarGameState {
  const players: BeastyBarPlayer[] = [];

  for (let i = 0; i < playerCount; i++) {
    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    const deck = createAnimalDeck(i, color);
    // 12 cards total: 4 in hand, 8 in draw stack
    const hand = deck.splice(0, 4);
    const drawStack = deck; // Remaining 8 cards

    players.push({
      id: `player-${i}`,
      index: i,
      color,
      name: playerNames[i] || `Player ${i + 1}`,
      hand,
      drawStack,
      wildCafe: [],
      thatsIt: [],
      totalCards: 0,
    });
  }

  return {
    players,
    currentPlayerIndex: 0,
    bumpingZone: {
      animals: [],
      maxSize: 5,
      heavenGateDirection: "normal",
    },
    phase: "playing",
    turn: 1,
    gameOver: false,
    winnerIndices: [],
    lastAction: "Game started!",
    pendingEffect: null,
  };
}

export function getAnimalEmoji(type: AnimalType): string {
  const emojis: Record<AnimalType, string> = {
    lion: "🦁",
    hippopotamus: "🦛",
    crocodile: "🐊",
    snake: "🐍",
    giraffe: "🦒",
    zebra: "🦓",
    beaver: "🦫",
    chameleon: "🦎",
    monkey: "🐒",
    kangaroo: "🦘",
    parrot: "🦜",
    binturong: "🦨",
  };
  return emojis[type];
}

export function getAnimalDescription(type: AnimalType, lang: "en" | "fa"): string {
  const descriptions: Record<AnimalType, { en: string; fa: string }> = {
    lion: {
      en: "Frightens monkeys and moves to front. Exiled if another lion exists.",
      fa: "میمون‌ها را می‌ترساند و به جلو می‌رود. اگر شیر دیگری باشد، تبعید می‌شود.",
    },
    hippopotamus: {
      en: "Pushes forward until blocked by same species, stronger animal, or zebra.",
      fa: "به جلو هل می‌دهد تا زمانی که توسط هم‌نوع، حیوان قوی‌تر، یا گورخر مسدود شود.",
    },
    crocodile: {
      en: "Eats weaker animals in front until blocked by stronger animal or zebra.",
      fa: "حیوانات ضعیف‌تر را می‌خورد تا زمانی که توسط حیوان قوی‌تر یا گورخر مسدود شود.",
    },
    snake: {
      en: "Reorders all animals by power (strongest near Heaven's Gate).",
      fa: "همه حیوانات را بر اساس قدرت مرتب می‌کند (قوی‌تر نزدیک درگاه بهشت).",
    },
    giraffe: {
      en: "Steps over one weaker animal directly in front.",
      fa: "از روی یک حیوان ضعیف‌تر مستقیماً جلوتر می‌پرد.",
    },
    zebra: {
      en: "Protection: Hippos and crocodiles cannot pass or eat.",
      fa: "حفاظت: اسب‌های آبی و تمساح‌ها نمی‌توانند عبور کنند یا بخورند.",
    },
    beaver: {
      en: "Swaps Heaven's Gate and Exile cards (reverses direction).",
      fa: "کارت‌های درگاه بهشت و تبعید را جابجا می‌کند (جهت را برعکس می‌کند).",
    },
    chameleon: {
      en: "Copies another animal's ability and power for one turn.",
      fa: "توانایی و قدرت حیوان دیگری را برای یک نوبت کپی می‌کند.",
    },
    monkey: {
      en: "Second monkey exiles all crocs and hippos, monkeys gather behind.",
      fa: "میمون دوم تمام تمساح‌ها و اسب‌های آبی را تبعید می‌کند، میمون‌ها جمع می‌شوند.",
    },
    kangaroo: {
      en: "Jumps over last 1 or 2 animals in the line.",
      fa: "از روی ۱ یا ۲ حیوان آخر در صف می‌پرد.",
    },
    parrot: {
      en: "Removes any one animal from the Bumping Zone.",
      fa: "یک حیوان را از ناحیه برخورد حذف می‌کند.",
    },
    binturong: {
      en: "Eliminates two strongest animals of different species.",
      fa: "دو حیوان قوی‌تر از گونه‌های مختلف را حذف می‌کند.",
    },
  };
  return descriptions[type][lang];
}
