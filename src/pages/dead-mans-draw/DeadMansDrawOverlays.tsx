import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";
import { cn } from "@/lib/utils";

import { PendingChoices } from "./PendingChoices";
import type {
  DeadMansDrawExitModalProps,
  DeadMansDrawPendingDrawerProps,
  DeadMansDrawSummaryModalProps,
} from "./types";

export function DeadMansDrawSummaryModal({
  open,
  dir,
  t,
  onClose,
}: DeadMansDrawSummaryModalProps) {
  if (!open) return null;
  const isRTL = dir === "rtl";
  const powers = [
    ["deadMansDrawPowerLeCorsaireName", "deadMansDrawPowerLeCorsaireAbility"],
    ["deadMansDrawPowerMadamMargotName", "deadMansDrawPowerMadamMargotAbility"],
    ["deadMansDrawPowerGhallegarName", "deadMansDrawPowerGhallegarAbility"],
    ["deadMansDrawPowerScurvyPeteName", "deadMansDrawPowerScurvyPeteAbility"],
    ["deadMansDrawPowerZaharaName", "deadMansDrawPowerZaharaAbility"],
    ["deadMansDrawPowerGunnieName", "deadMansDrawPowerGunnieAbility"],
    ["deadMansDrawPowerBlackBonnieName", "deadMansDrawPowerBlackBonnieAbility"],
    ["deadMansDrawPowerSirLoveswordName", "deadMansDrawPowerSirLoveswordAbility"],
    ["deadMansDrawPowerSeamusQuinnName", "deadMansDrawPowerSeamusQuinnAbility"],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        dir={dir}
        className="relative w-full max-w-lg rounded-[32px] border border-teal-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]"
        style={{
          backgroundImage: `linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.93)), url(${zirkhakiBackground})`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={isRTL
            ? "absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
            : "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"}
          aria-label={t("cancel")}
        >
          x
        </button>
        <p className={cn("mt-3 text-sm leading-6 text-slate-200/85", isRTL && "text-right font-persian")}>
          {t("deadMansDrawTutorialSummaryIntro")}
        </p>
        <div className="mt-5 max-h-[62vh] space-y-3 overflow-y-auto pr-1">
          <h3 className={cn("text-base font-semibold text-teal-100", isRTL && "text-right")}>{t("deadMansDrawSpecialPowersLabel")}</h3>
          {powers.map(([nameKey, abilityKey]) => (
            <section key={nameKey} className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", isRTL && "text-right")}>
              <h4 className="font-semibold text-teal-100">{t(nameKey)}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-200/85">{t(abilityKey)}</p>
            </section>
          ))}
        </div>
        <div className={cn("mt-5 flex", isRTL ? "justify-start" : "justify-end")}>
          <Button variant="game" onClick={onClose}>{t("quickRulesClose")}</Button>
        </div>
      </motion.div>
    </div>
  );
}

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export function DeadMansDrawExitModal({
  open,
  dir,
  t,
  onClose,
  onLeave,
}: DeadMansDrawExitModalProps) {
  const isRTL = dir === "rtl";

  return (
    <AlertDialog open={!!open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent className={cn("max-w-md rounded-[24px] p-6", isRTL ? "text-right" : "")}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leaveGameTitle")}</AlertDialogTitle>
        </AlertDialogHeader>
        <p className={cn("mt-2 text-sm text-slate-200/85", isRTL && "font-persian")}>{t("leaveGameDescription")}</p>
        <AlertDialogFooter className={cn("mt-4", isRTL && "flex-row-reverse") }>
          <AlertDialogCancel onClick={onClose}>{t("stay")}</AlertDialogCancel>
          <AlertDialogAction onClick={onLeave}>{t("leaveGameAction")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeadMansDrawPendingDrawer({
  pendingEffect,
  t,
  collapsed,
  onToggleCollapsed,
  disabled,
  onAstrolabe,
  onPistol,
  onDagger,
  onHorseshoe,
  onMap,
  onMisfire,
  top,
}: DeadMansDrawPendingDrawerProps) {
  if (!pendingEffect) return null;

  return (
    <div className={top ? "fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-4" : "fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4"}>
      <motion.div
        layout
        className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-cover bg-center p-4 shadow-[0_-12px_40px_rgba(2,6,23,0.55)] backdrop-blur sm:max-w-lg"
        style={{
          backgroundImage: `linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.94)), url(${zirkhakiBackground})`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {!collapsed ? (
            <div>
              <h2 className="mt-1 font-cinzel text-xl text-white">{t("deadMansDrawActiveChoices")}</h2>
            </div>
          ) : <span />}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80 transition hover:bg-white/10"
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>⌄</motion.span>
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{ height: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1, marginTop: collapsed ? 0 : 16 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <PendingChoices
              pendingEffect={pendingEffect}
              onAstrolabe={onAstrolabe}
              onPistol={onPistol}
              onDagger={onDagger}
              onHorseshoe={onHorseshoe}
              onMap={onMap}
              onMisfire={onMisfire}
              disabled={disabled}
              t={t}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
