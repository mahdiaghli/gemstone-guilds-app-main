import type { TranslationKey } from "@/hooks/useLanguage";
import type { DeadMansDrawRing, DeadMansDrawSuit } from "@/lib/deadMansDraw";

import coinZirkhaki from "@/assets/coin-zirkhaki.png";
import chestImage from "@/assets/chest.png";
import keyImage from "@/assets/key.png";
import mapImage from "@/assets/map.png";
import canonImage from "@/assets/canon.png";
import oracleImage from "@/assets/oracle.png";
import ancorImage from "@/assets/ancor.png";
import swordImage from "@/assets/sword.png";
import krakenImage from "@/assets/kraken.png";
import hookImage from "@/assets/hook.png";
import chestKeyPower from "@/assets/chest and key opponent.png";
import chestKeyCharacter from "@/assets/chest and key opponent man.png";
import getHookPower from "@/assets/get hook and other.png";
import getHookCharacter from "@/assets/get hook and other man.png";
import canonYourselfPower from "@/assets/canon yourself too.png";
import canonYourselfCharacter from "@/assets/canon yourself too man.png";
import futureTellerPower from "@/assets/future teller.png";
import futureTellerCharacter from "@/assets/future teller person.png";
import swordSnakePower from "@/assets/sword and snake.png";
import swordSnakeCharacter from "@/assets/sword and snake person.png";
import canonStackPower from "@/assets/canon stack.png";
import canonStackCharacter from "@/assets/canon stack man.png";
import coinGetterPower from "@/assets/coin getter.png";
import coinGetterCharacter from "@/assets/coin getter man.png";
import extraCardsPower from "@/assets/4 extra cards.png";
import extraCardsCharacter from "@/assets/4 extra card man.png";
import bankOnesBustsPower from "@/assets/bank one's busts.png";
import bankOnesBustsCharacter from "@/assets/bank one's busts person.png";

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
