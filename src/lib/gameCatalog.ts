export type GameId =
  | "splendor"
  | "dead-mans-draw"
  | "totem"
  | "beasty-bar"
  | "coup"
  | "ticket-to-ride";

export type GameConfig = {
  id: GameId;
  name: string;
  subtitle: string;
  badge: string;
  accentFrom: string;
  accentTo: string;
};

export const DEFAULT_GAME_ID: GameId = "splendor";

export const GAME_CATALOG: GameConfig[] = [
  {
    id: "splendor",
    name: "Splendor",
    subtitle: "Collect gems, buy cards, and race for noble prestige.",
    badge: "Jewels",
    accentFrom: "#f5d47a",
    accentTo: "#2dd4bf",
  },
  {
    id: "dead-mans-draw",
    name: "Dead Man's Draw",
    subtitle: "Push your luck, plunder treasure, and stop before the bust.",
    badge: "Pirates",
    accentFrom: "#fb7185",
    accentTo: "#f59e0b",
  },
  {
    id: "totem",
    name: "Totem",
    subtitle: "Read the table, play symbols fast, and outmaneuver the room.",
    badge: "Tribal",
    accentFrom: "#22c55e",
    accentTo: "#eab308",
  },
  {
    id: "beasty-bar",
    name: "Beasty Bar",
    subtitle: "Guide animals to the Wild Cafe in this chaotic party game.",
    badge: "Party",
    accentFrom: "#f97316",
    accentTo: "#22c55e",
  },
  {
    id: "coup",
    name: "Coup",
    subtitle: "Bluff, challenge, and eliminate rivals with perfect timing.",
    badge: "Bluff",
    accentFrom: "#c084fc",
    accentTo: "#ef4444",
  },
  {
    id: "ticket-to-ride",
    name: "Ticket to Ride",
    subtitle: "Claim routes, connect cities, and complete long-distance plans.",
    badge: "Routes",
    accentFrom: "#60a5fa",
    accentTo: "#f97316",
  },
];

export const findGameById = (gameId?: string | null) =>
  GAME_CATALOG.find((game) => game.id === gameId);

export const getGameById = (gameId?: string | null) =>
  findGameById(gameId) ?? GAME_CATALOG[0];

export const getGameMenuPath = (gameId?: string | null) =>
  `/menu/${getGameById(gameId).id}`;
