import type { TranslationKey } from "@/hooks/useLanguage";
import type { DeadMansDrawRing, DeadMansDrawSuit } from "@/lib/deadMansDraw";

import coinZirkhaki from "@/assets/coin-zirkhaki.webp";
import chestImage from "@/assets/chest.webp";
import keyImage from "@/assets/key.webp";
import mapImage from "@/assets/map.webp";
import canonImage from "@/assets/canon.webp";
import oracleImage from "@/assets/oracle.webp";
import ancorImage from "@/assets/ancor.webp";
import swordImage from "@/assets/sword.webp";
import krakenImage from "@/assets/kraken.webp";
import hookImage from "@/assets/hook.webp";
import chestKeyPower from "@/assets/chest and key opponent.webp";
import chestKeyCharacter from "@/assets/chest and key opponent man.webp";
import getHookPower from "@/assets/get hook and other.webp";
import getHookCharacter from "@/assets/get hook and other man.webp";
import canonYourselfPower from "@/assets/canon yourself too.webp";
import canonYourselfCharacter from "@/assets/canon yourself too man.webp";
import futureTellerPower from "@/assets/future teller.webp";
import futureTellerCharacter from "@/assets/future teller person.webp";
import swordSnakePower from "@/assets/sword and snake.webp";
import swordSnakeCharacter from "@/assets/sword and snake person.webp";
import canonStackPower from "@/assets/canon stack.webp";
import canonStackCharacter from "@/assets/canon stack man.webp";
import coinGetterPower from "@/assets/coin getter.webp";
import coinGetterCharacter from "@/assets/coin getter man.webp";
import extraCardsPower from "@/assets/4 extra cards.webp";
import extraCardsCharacter from "@/assets/4 extra card man.webp";
import bankOnesBustsPower from "@/assets/bank one's busts.webp";
import bankOnesBustsCharacter from "@/assets/bank one's busts person.webp";

export const SUIT_IMAGES: Record<DeadMansDrawSuit, string> = {
  astrolabe: oracleImage,
  pistol: canonImage,
  dagger: swordImage,
  carpet: ancorImage,
  snake: krakenImage,
  coin: coinZirkhaki,
  horseshoe: hookImage,
  map: mapImage,
  chest: chestImage,
  key: keyImage,
};

export const ENGLISH_SUIT_NAMES: Record<DeadMansDrawSuit, string> = {
  astrolabe: "Astrolabe",
  pistol: "Pistol",
  dagger: "Dagger",
  carpet: "Carpet",
  snake: "Snake",
  coin: "Coin",
  horseshoe: "Horseshoe",
  map: "Map",
  chest: "Chest",
  key: "Key",
};

export const SUIT_TRANSLATION_KEYS: Record<DeadMansDrawSuit, TranslationKey> = {
  astrolabe: "deadMansDrawSuitAstrolabe",
  pistol: "deadMansDrawSuitPistol",
  dagger: "deadMansDrawSuitDagger",
  carpet: "deadMansDrawSuitCarpet",
  snake: "deadMansDrawSuitSnake",
  coin: "deadMansDrawSuitCoin",
  horseshoe: "deadMansDrawSuitHorseshoe",
  map: "deadMansDrawSuitMap",
  chest: "deadMansDrawSuitChest",
  key: "deadMansDrawSuitKey",
};

export const SUIT_DESCRIPTION_KEYS: Record<DeadMansDrawSuit, TranslationKey> = {
  astrolabe: "deadMansDrawSuitHelpAstrolabe",
  pistol: "deadMansDrawSuitHelpPistol",
  dagger: "deadMansDrawSuitHelpDagger",
  carpet: "deadMansDrawSuitHelpCarpet",
  snake: "deadMansDrawSuitHelpSnake",
  coin: "deadMansDrawSuitHelpCoin",
  horseshoe: "deadMansDrawSuitHelpHorseshoe",
  map: "deadMansDrawSuitHelpMap",
  chest: "deadMansDrawSuitHelpChest",
  key: "deadMansDrawSuitHelpKey",
};

export const POWER_VISUALS: Record<DeadMansDrawRing, { power: string; character: string; label: string }> = {
  "le-corsaire": {
    power: chestKeyPower,
    character: chestKeyCharacter,
    label: "Le Corsaire",
  },
  "madam-margot": {
    power: bankOnesBustsPower,
    character: bankOnesBustsCharacter,
    label: "Madam Margot",
  },
  ghallegar: {
    power: getHookPower,
    character: getHookCharacter,
    label: "Ghallegar",
  },
  "scurvy-pete": {
    power: canonYourselfPower,
    character: canonYourselfCharacter,
    label: "Scurvy Pete",
  },
  zahara: {
    power: futureTellerPower,
    character: futureTellerCharacter,
    label: "Zahara",
  },
  gunnie: {
    power: canonStackPower,
    character: canonStackCharacter,
    label: "Gunnie",
  },
  "black-bonnie": {
    power: swordSnakePower,
    character: swordSnakeCharacter,
    label: "Black Bonnie",
  },
  "sir-lovesword": {
    power: coinGetterPower,
    character: coinGetterCharacter,
    label: "Sir Lovesword",
  },
  "seamus-quinn": {
    power: extraCardsPower,
    character: extraCardsCharacter,
    label: "Seamus Quinn",
  },
};

export const DEAD_MANS_DRAW_TUTORIAL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type DeadMansDrawTutorialStep = typeof DEAD_MANS_DRAW_TUTORIAL_STEPS[number];

export type DeadMansDrawTutorialTitleKey =
  `deadMansDrawTutorialStep${DeadMansDrawTutorialStep}Title`;

export type DeadMansDrawTutorialBodyKey =
  `deadMansDrawTutorialStep${DeadMansDrawTutorialStep}Body`;

export type DeadMansDrawTutorialSummaryKey =
  `deadMansDrawTutorialStep${DeadMansDrawTutorialStep}Summary`;

export interface DeadMansDrawInteractiveTutorialStep {
  title: string;
  description: string;
  focus: "intro" | "deck-section" | "player-panel" | "treasure-area" | "cards" | "powers";
  action: "reveal" | "collect" | null;
}

export const getPowerAbilityKey = (ringId: DeadMansDrawRing) => {
  switch (ringId) {
    case "le-corsaire":
      return "deadMansDrawPowerLeCorsaireAbility";
    case "madam-margot":
      return "deadMansDrawPowerMadamMargotAbility";
    case "ghallegar":
      return "deadMansDrawPowerGhallegarAbility";
    case "scurvy-pete":
      return "deadMansDrawPowerScurvyPeteAbility";
    case "zahara":
      return "deadMansDrawPowerZaharaAbility";
    case "gunnie":
      return "deadMansDrawPowerGunnieAbility";
    case "black-bonnie":
      return "deadMansDrawPowerBlackBonnieAbility";
    case "sir-lovesword":
      return "deadMansDrawPowerSirLoveswordAbility";
    case "seamus-quinn":
      return "deadMansDrawPowerSeamusQuinnAbility";
  }
};
