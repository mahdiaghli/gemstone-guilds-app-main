import {
  type DeadMansDrawPendingEffect,
  type DeadMansDrawSuit,
} from "@/lib/deadMansDraw";
import { Button } from "@/components/ui/button";

import type { Translate } from "./helpers";
import { CardChip } from "./CardChip";

export function PendingChoices({
  pendingEffect,
  onAstrolabe,
  onPistol,
  onDagger,
  onHorseshoe,
  onMap,
  onMisfire,
  disabled = false,
  t,
}: {
  pendingEffect: DeadMansDrawPendingEffect;
  onAstrolabe: (reveal: boolean) => void;
  onPistol: (targetPlayerIndex: number, suit: DeadMansDrawSuit) => void;
  onDagger: (targetPlayerIndex: number, suit: DeadMansDrawSuit) => void;
  onHorseshoe: (suit: DeadMansDrawSuit) => void;
  onMap: (cardId: string) => void;
  onMisfire: (suit: DeadMansDrawSuit) => void;
  disabled?: boolean;
  t: Translate;
}) {
  if (pendingEffect.kind === "astrolabe") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/70">{t("deadMansDrawPeekedCards")}</p>
        <div className="grid grid-cols-3 gap-2">
          {pendingEffect.peekCards.map((card, index) => (
            <div key={card.id} className="space-y-2">
              <p className="text-center text-[11px] uppercase tracking-[0.24em] text-teal-100/60">
                {index === 0 ? t("deadMansDrawFirstCard") : index === 1 ? t("deadMansDrawSecondCard") : t("deadMansDrawThirdCard")}
              </p>
              <CardChip card={card} compact />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="game" onClick={() => onAstrolabe(true)} disabled={disabled}>{t("deadMansDrawRevealTopCard")}</Button>
          <Button variant="ghost" onClick={() => onAstrolabe(false)} disabled={disabled}>{t("deadMansDrawCollectNow")}</Button>
        </div>
      </div>
    );
  }

  if (pendingEffect.kind === "pistol" || pendingEffect.kind === "dagger") {
    return (
      <div className="space-y-4">
        {pendingEffect.options.map((option) => (
          <div key={option.playerIndex} className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="mb-3 font-cinzel text-sm tracking-[0.2em] text-white/75">{t("deadMansDrawTargetPlayer", { player: option.playerIndex + 1 })}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {option.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => pendingEffect.kind === "pistol" ? onPistol(option.playerIndex, card.suit) : onDagger(option.playerIndex, card.suit)}
                >
                  <CardChip card={card} compact />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (pendingEffect.kind === "horseshoe" || pendingEffect.kind === "misfire") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/70">{pendingEffect.kind === "horseshoe" ? t("deadMansDrawChooseStashCard") : t("deadMansDrawChooseMisfireCard")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pendingEffect.options.map((card) => (
            <button key={card.id} type="button" onClick={() => pendingEffect.kind === "horseshoe" ? onHorseshoe(card.suit) : onMisfire(card.suit)} disabled={disabled}>
              <CardChip card={card} compact />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70">{t("deadMansDrawChooseBurnedCard")}</p>
      <div className="flex flex-wrap gap-3">
        {pendingEffect.options.map((card) => (
          <button key={card.id} type="button" onClick={() => onMap(card.id)} disabled={disabled}>
            <CardChip card={card} compact />
          </button>
        ))}
      </div>
    </div>
  );
}
