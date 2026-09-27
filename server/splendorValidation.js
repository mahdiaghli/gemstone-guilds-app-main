import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { advanceSplendorTurn } from "./splendorTurn.js";

const colors = ["diamond", "sapphire", "emerald", "ruby", "onyx"];
const tokens = [...colors, "gold"];
const raw = JSON.parse(readFileSync(resolve("src/components/game/cards-Splendor.json"), "utf8"));
const colorMap = { white: "diamond", blue: "sapphire", green: "emerald", red: "ruby", black: "onyx" };

function mapColors(values) {
  const result = {};
  for (const [key, value] of Object.entries(values || {})) {
    if (colorMap[key] && value > 0) result[colorMap[key]] = value;
  }
  return result;
}

const allCards = [...raw.cards, ...raw.nobles.filter((entry) => entry.level && entry.color && entry.cost)]
  .map((card) => ({ id: card.id, level: card.level, gemBonus: colorMap[card.color], points: card.points, cost: mapColors(card.cost) }));
const allNobles = raw.nobles.filter((entry) => !entry.level && (entry.requirement || entry.requirements))
  .map((noble, index) => ({
    id: typeof noble.id === "number" ? noble.id : index + 1,
    points: noble.points,
    requirements: mapColors(noble.requirement || noble.requirements),
  }));
const cardById = new Map(allCards.map((card) => [card.id, card]));
const nobleById = new Map(allNobles.map((noble) => [noble.id, noble]));

function cardsInState(state) {
  return [
    ...[1, 2, 3].flatMap((level) => [...(state.decks?.[level] || []), ...(state.visibleCards?.[level] || [])]),
    ...(state.players || []).flatMap((player) => [...(player.cards || []), ...(player.reservedCards || [])]),
  ].filter(Boolean);
}

function noblesInState(state) {
  return [...(state.nobles || []), ...(state.players || []).flatMap((player) => player.nobles || [])];
}

export function isValidSplendorState(state, playerCount) {
  try {
  if (!state || !Array.isArray(state.players) || state.players.length !== playerCount ||
    !Number.isInteger(state.currentPlayerIndex) || state.currentPlayerIndex < 0 ||
    state.currentPlayerIndex >= playerCount || !state.tokenPool) return false;
  const seenCards = new Set();
  for (const card of cardsInState(state)) {
    if (!cardById.has(card.id) || !isDeepStrictEqual(card, cardById.get(card.id)) || seenCards.has(card.id)) return false;
    seenCards.add(card.id);
  }
  if (seenCards.size !== cardById.size) return false;
  const seenNobles = new Set();
  for (const noble of noblesInState(state)) {
    if (!nobleById.has(noble.id) || !isDeepStrictEqual(noble, nobleById.get(noble.id)) || seenNobles.has(noble.id)) return false;
    seenNobles.add(noble.id);
  }
  if (seenNobles.size !== playerCount + 1) return false;
  for (let index = 0; index < state.players.length; index++) {
    const player = state.players[index];
    if (!player || player.id !== index || !player.tokens || !Array.isArray(player.cards) ||
      !Array.isArray(player.reservedCards) || player.reservedCards.length > 3 || !Array.isArray(player.nobles)) return false;
  }
  const initialGemCount = playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7;
  for (const token of tokens) {
    const values = [state.tokenPool[token], ...state.players.map((player) => player.tokens[token])];
    if (values.some((value) => !Number.isInteger(value) || value < 0)) return false;
    if (values.reduce((sum, value) => sum + value, 0) !== (token === "gold" ? 5 : initialGemCount)) return false;
  }
  return true;
  } catch {
    return false;
  }
}

export function isValidInitialSplendorState(state, playerCount) {
  if (!isValidSplendorState(state, playerCount) || state.currentPlayerIndex !== 0 ||
    state.gameOver !== false || state.winner !== null || state.isLastRound !== false ||
    state.lastRoundTriggerIndex !== null) return false;
  return state.players.every((player) => player.cards.length === 0 && player.reservedCards.length === 0 &&
    player.nobles.length === 0 && tokens.every((token) => player.tokens[token] === 0)) &&
    [1, 2, 3].every((level) => state.visibleCards?.[level]?.length === 4 &&
      state.visibleCards[level].every((card) => card?.level === level) &&
      state.decks?.[level]?.every((card) => card.level === level));
}

function bonuses(player) {
  const result = Object.fromEntries(colors.map((color) => [color, 0]));
  for (const card of player.cards) result[card.gemBonus]++;
  return result;
}

function take(state, gems) {
  if (!gems.length || gems.length > 3 || gems.some((gem) => !colors.includes(gem))) return null;
  const pool = { ...state.tokenPool };
  const players = [...state.players];
  const current = players[state.currentPlayerIndex];
  const player = { ...current, tokens: { ...current.tokens } };
  if (gems.length === 2 && gems[0] === gems[1]) {
    if (pool[gems[0]] < 4) return null;
  } else if (new Set(gems).size !== gems.length) return null;
  for (const gem of gems) {
    if (pool[gem] < 1) return null;
    pool[gem]--;
    player.tokens[gem]++;
  }
  players[state.currentPlayerIndex] = player;
  return { ...state, players, tokenPool: pool };
}

function refill(state, level, index) {
  const decks = { ...state.decks, [level]: [...state.decks[level]] };
  const visibleCards = { ...state.visibleCards, [level]: [...state.visibleCards[level]] };
  visibleCards[level][index] = decks[level].shift() || null;
  return { ...state, decks, visibleCards };
}

function purchase(state, cardId) {
  const players = [...state.players];
  const current = players[state.currentPlayerIndex];
  const player = { ...current, tokens: { ...current.tokens }, cards: [...current.cards], reservedCards: [...current.reservedCards] };
  let card = null;
  let source = "visible";
  let level = 1;
  let position = -1;
  for (const candidateLevel of [1, 2, 3]) {
    position = state.visibleCards[candidateLevel].findIndex((entry) => entry?.id === cardId);
    if (position >= 0) {
      card = state.visibleCards[candidateLevel][position];
      level = candidateLevel;
      break;
    }
  }
  if (!card) {
    position = player.reservedCards.findIndex((entry) => entry.id === cardId);
    if (position >= 0) {
      card = player.reservedCards[position];
      source = "reserved";
    }
  }
  if (!card) return null;
  const bonus = bonuses(player);
  const pool = { ...state.tokenPool };
  let goldNeeded = 0;
  for (const gem of colors) {
    const remaining = Math.max(0, (card.cost[gem] || 0) - bonus[gem]);
    const used = Math.min(remaining, player.tokens[gem]);
    player.tokens[gem] -= used;
    pool[gem] += used;
    goldNeeded += remaining - used;
  }
  if (goldNeeded > player.tokens.gold) return null;
  player.tokens.gold -= goldNeeded;
  pool.gold += goldNeeded;
  player.cards.push(card);
  if (source === "reserved") player.reservedCards.splice(position, 1);
  players[state.currentPlayerIndex] = player;
  let result = { ...state, players, tokenPool: pool };
  if (source === "visible") result = refill(result, level, position);
  return result;
}

function reserve(state, cardId, fromDeckLevel) {
  const players = [...state.players];
  const current = players[state.currentPlayerIndex];
  if (current.reservedCards.length >= 3) return null;
  const player = { ...current, tokens: { ...current.tokens }, reservedCards: [...current.reservedCards] };
  let result = { ...state };
  let card = null;
  if (fromDeckLevel) {
    if (!state.decks[fromDeckLevel]?.length) return null;
    const decks = { ...state.decks, [fromDeckLevel]: [...state.decks[fromDeckLevel]] };
    card = decks[fromDeckLevel].shift();
    result.decks = decks;
  } else {
    for (const level of [1, 2, 3]) {
      const position = state.visibleCards[level].findIndex((entry) => entry?.id === cardId);
      if (position >= 0) {
        card = state.visibleCards[level][position];
        result = refill(state, level, position);
        break;
      }
    }
  }
  if (!card) return null;
  player.reservedCards.push(card);
  const pool = { ...result.tokenPool };
  if (pool.gold > 0) {
    pool.gold--;
    player.tokens.gold++;
  }
  players[state.currentPlayerIndex] = player;
  return { ...result, players, tokenPool: pool };
}

function returnToken(state, token) {
  const players = [...state.players];
  const current = players[state.currentPlayerIndex];
  if (!tokens.includes(token) || current.tokens[token] < 1) return null;
  const player = { ...current, tokens: { ...current.tokens } };
  const pool = { ...state.tokenPool };
  player.tokens[token]--;
  pool[token]++;
  players[state.currentPlayerIndex] = player;
  return { ...state, players, tokenPool: pool };
}

export function isValidSplendorTransition(previous, next, targetScore = 15) {
  try {
  if (!isValidSplendorState(next, previous?.players?.length || 0) || previous.gameOver) return false;
  const current = previous.players[previous.currentPlayerIndex];
  const nextPlayer = next.players[previous.currentPlayerIndex];
  const candidates = [previous, advanceSplendorTurn(previous, targetScore)];
  const takenGems = colors.flatMap((gem) => Array.from({ length: Math.max(0, previous.tokenPool[gem] - next.tokenPool[gem]) }, () => gem));
  if (takenGems.length) candidates.push(take(previous, takenGems));
  const addedCards = nextPlayer.cards.filter((card) => !current.cards.some((old) => old.id === card.id));
  if (addedCards.length === 1) candidates.push(purchase(previous, addedCards[0].id));
  const addedReserved = nextPlayer.reservedCards.filter((card) => !current.reservedCards.some((old) => old.id === card.id));
  if (addedReserved.length === 1) {
    candidates.push(reserve(previous, addedReserved[0].id));
    for (const level of [1, 2, 3]) candidates.push(reserve(previous, null, level));
  }
  for (const token of tokens) candidates.push(returnToken(previous, token));
  return candidates.some((candidate) => candidate &&
    (isDeepStrictEqual(candidate, next) || isDeepStrictEqual(advanceSplendorTurn(candidate, targetScore), next)));
  } catch {
    return false;
  }
}
