import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import zirkhakiBackground from "@/assets/background-zirkhaki.png";

import { PendingChoices } from "./PendingChoices";
import type {
  DeadMansDrawExitModalProps,
  DeadMansDrawPendingDrawerProps,
  DeadMansDrawSummaryModalProps,
} from "./types";
import {
  type DeadMansDrawTutorialSummaryKey,
  type DeadMansDrawTutorialTitleKey,
} from "./shared";

export function DeadMansDrawSummaryModal({
  open,
  t,
  tutorialSteps,
  onClose,
}: DeadMansDrawSummaryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg rounded-[32px] border border-teal-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]"
        style={{
          backgroundImage: `linear-gradient(rgba(2,6,23,0.9), rgba(2,6,23,0.93)), url(${zirkhakiBackground})`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          aria-label={t("cancel")}
        >
          x
        </button>
        <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-teal-100/55">{t("gameSummary")}</p>
        <h2 className="mt-2 font-cinzel text-3xl text-white">{t("deadMansDrawTutorialTitle")}</h2>
        <p className="mt-3 text-sm leading-5 text-slate-300/80">{t("deadMansDrawTutorialSummaryIntro")}</p>
        <div className="mt-6 space-y-3">
          {tutorialSteps.map((step) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="font-cinzel text-sm text-amber-100">
                {t(`deadMansDrawTutorialStep${step}Title` as DeadMansDrawTutorialTitleKey)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-200/85">
                {t(`deadMansDrawTutorialStep${step}Summary` as DeadMansDrawTutorialSummaryKey)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function DeadMansDrawExitModal({
  open,
  t,
  onClose,
  onLeave,
}: DeadMansDrawExitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md rounded-[32px] border border-rose-300/25 bg-cover bg-center p-6 shadow-[0_24px_80px_rgba(2,6,23,0.7)]"
        style={{
          backgroundImage: `linear-gradient(rgba(40,10,14,0.9), rgba(20,8,12,0.93)), url(${zirkhakiBackground})`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          aria-label={t("cancel")}
        >
          x
        </button>
        <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-rose-100/55">{t("leaveGameTitle")}</p>
        <h2 className="mt-2 font-cinzel text-3xl text-white">{t("leaveGameTitle")}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-200/80">{t("leaveGameDescription")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={onClose}>{t("stay")}</Button>
          <Button variant="game" onClick={onLeave}>{t("leaveGameAction")}</Button>
        </div>
      </motion.div>
    </div>
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
}: DeadMansDrawPendingDrawerProps) {
  if (!pendingEffect) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4">
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
