import type { DeadMansDrawSuit } from "@/lib/deadMansDraw";

import { ENGLISH_SUIT_NAMES, SUIT_TRANSLATION_KEYS } from "./shared";

export type Translate = (key: any, values?: Record<string, string | number>) => string;

export function getSuitLabel(suit: DeadMansDrawSuit, t: Translate) {
  return t(SUIT_TRANSLATION_KEYS[suit]);
}

export function translateActionLabel(action: string, t: Translate) {
  const suit = (Object.entries(ENGLISH_SUIT_NAMES) as Array<[DeadMansDrawSuit, string]>).find(([, label]) =>
    action.includes(label),
  )?.[0];
  const suitLabel = suit ? getSuitLabel(suit, t) : null;

  const turnMatch = action.match(/^Player (\d+)'s turn begins\.$/);
  if (turnMatch) return t("deadMansDrawActionTurnBegins", { player: turnMatch[1] });

  const nextMatch = action.match(/^Player (\d+) takes over after the bust\.$/);
  if (nextMatch) return t("deadMansDrawActionBustTurnBegins", { player: nextMatch[1] });

  const collectBonusMatch = action.match(/^Collected treasure and recovered (\d+) bonus card\(s\)\.$/);
  if (collectBonusMatch) return t("deadMansDrawActionCollectedBonus", { count: collectBonusMatch[1] });

  const plunderMatch = action.match(/^Collected treasure and plundered (\d+) bonus card\(s\) from opponents\.$/);
  if (plunderMatch) return t("deadMansDrawActionPlundered", { count: plunderMatch[1] });

  const chooseRingMatch = action.match(/^Player (\d+), choose your ring power\.$/);
  if (chooseRingMatch) return t("deadMansDrawActionChooseRing", { player: chooseRingMatch[1] });

  const chooseMadamMatch = action.match(/^Player (\d+), choose which opponent Madam Margot watches\.$/);
  if (chooseMadamMatch) return t("deadMansDrawActionChooseMarkedOpponent", { player: chooseMadamMatch[1] });

  const madamMarkedMatch = action.match(/^Madam Margot marked Player (\d+)\.$/);
  if (madamMarkedMatch) return t("deadMansDrawActionMarkedOpponent", { player: madamMarkedMatch[1] });

  const snakeMatch = action.match(
    /^Snake revealed: draw (\d+) more card\(s\) before you can collect\.$/,
  );
  if (snakeMatch) return t("deadMansDrawActionSnakeForcedCount", { count: snakeMatch[1] });

  if (suitLabel) {
    if (action.endsWith(" added to the treasure area.")) return t("deadMansDrawActionSuitAdded", { suit: suitLabel });
    if (action.startsWith("Pistol burned ")) return t("deadMansDrawActionPistolBurned", { suit: suitLabel });
    if (action.startsWith("Pistol blasted the entire ")) return t("deadMansDrawActionGunnieBlast", { suit: suitLabel });
    if (action.startsWith("Dagger stole ")) return t("deadMansDrawActionDaggerStole", { suit: suitLabel });
    if (action.startsWith("Horseshoe played ")) return t("deadMansDrawActionHorseshoePlayed", { suit: suitLabel });
    if (action.startsWith("Map recovered ")) return t("deadMansDrawActionMapRecovered", { suit: suitLabel });
    if (action.startsWith("Misfire discarded your ")) return t("deadMansDrawActionMisfireDiscarded", { suit: suitLabel });
  }

  const exactMatches: Record<string, string> = {
    "Each player chooses 1 of 2 face-up ring powers.": "deadMansDrawActionChooseMode",
    "Choose whether to reveal or collect.": "deadMansDrawActionRevealOrCollect",
    "Bust! The Carpet saved part of the treasure.": "deadMansDrawActionCarpetSaved",
    "Bust! Everything goes to the burn pile.": "deadMansDrawActionFullBust",
    "Bust! Madam Margot banked the busted treasure.": "deadMansDrawActionMadamBust",
    "Astrolabe found nothing to inspect.": "deadMansDrawActionAstrolabeEmpty",
    "Astrolabe: inspect the top card(s), then reveal or collect.": "deadMansDrawActionAstrolabeInspect",
    "Pistol found no target.": "deadMansDrawActionPistolNoTarget",
    "Pistol: choose a card to burn from another player.": "deadMansDrawActionPistolChoose",
    "Dagger found no legal target.": "deadMansDrawActionDaggerNoTarget",
    "Dagger: steal a card into the treasure area.": "deadMansDrawActionDaggerChoose",
    "Horseshoe fizzled because there are no cards in your stash.": "deadMansDrawActionHorseshoeEmpty",
    "Horseshoe: play a card from your own stash.": "deadMansDrawActionHorseshoeChoose",
    "Map found no burned treasure to recover.": "deadMansDrawActionMapEmpty",
    "Map: choose 1 of 3 burned cards to play.": "deadMansDrawActionMapChoose",
    "Collected the revealed treasure.": "deadMansDrawActionCollected",
    "Collected treasure, but there was no plunder available.": "deadMansDrawActionNoPlunder",
    "Astrolabe ended the turn with a safe collect.": "deadMansDrawActionAstrolabeCollect",
    "Astrolabe chose to reveal the top card.": "deadMansDrawActionAstrolabeReveal",
    "All ring powers are locked in. Player 1 begins.": "deadMansDrawActionRingLocked",
    "Ghallegar's Anchor protects itself and draws one extra card.": "deadMansDrawActionGhallegarAnchor",
    "Scurvy Pete triggered Misfire: discard one of your own top cards.": "deadMansDrawActionScurvyPete",
    "Black Bonnie forced a Kraken into the treasure area before the Sword strike.": "deadMansDrawActionBlackBonnie",
    "Sir Lovesword banked a Coin immediately from the draw pile.": "deadMansDrawActionSirLovesword",
  };

  return exactMatches[action] ? t(exactMatches[action]) : action;
}
