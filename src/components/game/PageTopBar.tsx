import { useEffect, useMemo, useState } from "react";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import MenuSettingsDialog from "@/components/game/MenuSettingsDialog";
import coinIcon from "@/assets/coin.png";
import diamondIcon from "@/assets/diamond.png";
import cupIcon from "@/assets/cup.png";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { readPlayerExtras } from "@/lib/playerExtras";
// import rankIcon from "@/assets/boronze rank.png"; // مسیر درست آیکن ربات
import rankIcon from "@/assets/boronze rank.webp"; // مسیر درست آیکن ربات

import {
  getLevelFromXp,
  getLevelProgress,
  readProgress,
  type PlayerProgress,
} from "@/lib/progression";

export default function PageTopBar() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<PlayerProgress>({
    points: 0,
    coins: 0,
    xp: 0,
  });
  const [gems, setGems] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const nextProgress = readProgress(user?.id);
      const nextExtras = readPlayerExtras(user?.id);
      setProgress(nextProgress);
      setGems(nextExtras.gems);

      const level = getLevelFromXp(nextProgress.xp);
      const seenKey = `splendor-last-seen-level:${user?.id || "guest"}`;
      const seenLevel = Number(localStorage.getItem(seenKey) || "1");
      if (level > seenLevel) {
        setShowLevelUp(level);
        localStorage.setItem(seenKey, String(level));
      } else if (!localStorage.getItem(seenKey)) {
        localStorage.setItem(seenKey, String(level));
      }
    };

    syncState();
    window.addEventListener("splendor-progress-updated", syncState);
    window.addEventListener("splendor-player-extras-updated", syncState);
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener("splendor-progress-updated", syncState);
      window.removeEventListener("splendor-player-extras-updated", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [user?.id]);

  const levelInfo = useMemo(() => getLevelProgress(progress.xp), [progress.xp]);

  const formatNumber = (value: number) =>
    value.toLocaleString("en-US");

  const rankLabel = useMemo(() => {
    const pts = progress.points;
    if (pts >= 5000) return "Diamond";
    if (pts >= 2000) return "Gold";
    if (pts >= 800) return "Silver";
    return "Bronze";
  }, [progress.points]);
  return (
  <>
    <div
      className={cn("fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-3 md:px-4", dir === "rtl" ? "font-persian" : "")}
  dir="ltr"   // 👈 جهت این تاپ‌بار را همیشه LTR نگه می‌داریم
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-1 sm:max-w-lg md:max-w-6xl">
        {/* ردیف بالا: Coins + Gems وسط، Settings گوشه راست */}
        <div className="flex items-center justify-between gap-1">
          {/* Coins + Gems وسط */}
          <div className="flex flex-1 justify-center">
            <div className="flex items-center gap-1">
              {/* Coins */}
              <button
                onClick={() => navigate("/shop?section=coins")}
                className="flex items-center gap-1.5 rounded-2xl border border-yellow-400/45 bg-black/40 px-2 py-1 text-[11px] text-yellow-50 shadow-[0_0_10px_rgba(250,204,21,0.25)] backdrop-blur-sm active:scale-95 transition-transform"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/40 via-yellow-300/20 to-transparent shadow-[0_0_8px_rgba(250,204,21,0.7)]">
                  <img
                    src={coinIcon}
                    alt={t("coinsLabel")}
                    className="h-4 w-4 object-contain"
                  />
                </div>
                <span className="min-w-[52px] text-[11px] leading-none">
                  {formatNumber(progress.coins)}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-yellow-400/60 bg-black/60 text-yellow-200 text-[10px] shadow-[0_0_6px_rgba(250,204,21,0.7)]">
                  <Plus className="h-3 w-3" />
                </span>
              </button>

              {/* Gems */}
              <button
                onClick={() => navigate("/shop?section=diamonds")}
                className="flex items-center gap-1.5 rounded-2xl border border-sky-300/50 bg-black/40 px-2 py-1 text-[11px] text-sky-50 shadow-[0_0_10px_rgba(56,189,248,0.25)] backdrop-blur-sm active:scale-95 transition-transform"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-300/20 to-transparent shadow-[0_0_8px_rgba(56,189,248,0.8)]">
                  <img
                    src={diamondIcon}
                    alt={t("gemsLabel")}
                    className="h-4 w-4 object-contain"
                  />
                </div>
                <span className="min-w-[52px] text-[11px] leading-none">
                  {formatNumber(gems)}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/70 bg-black/60 text-sky-100 text-[10px] shadow-[0_0_6px_rgba(56,189,248,0.8)]">
                  <Plus className="h-3 w-3" />
                </span>
              </button>
            </div>
          </div>

          {/* Settings گوشه راست */}
          <div className="flex shrink-0 items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/70 bg-black/60 shadow-[0_0_16px_rgba(34,211,238,0.9)] transition-all hover:shadow-[0_0_22px_rgba(34,211,238,1)] active:scale-95"
            >
              <Settings className="h-4.5 w-4.5 text-cyan-200" />
            </button>
          </div>
        </div>
        {/* ردیف پایین: Level و Score کنار هم، هر دو وسط */}
        <div className="mt-0.5 flex w-full justify-center">
          <div className="flex w-full max-w-xs items-stretch justify-center gap-2">
            {/* Level */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex w-full flex-col rounded-2xl border border-primary/35 bg-black/60 px-2.5 py-1.5 text-[11px] text-foreground shadow-[0_0_12px_rgba(250,204,21,0.35)] backdrop-blur-sm">
<div className="flex items-center justify-between gap-2">
  {/* سمت چپ: xp */}
  <span className="shrink-0 text-[10px]">
    {levelInfo.currentXp}/{levelInfo.requiredXp}
  </span>

  {/* سمت راست: مرحله [label راست، عدد چپ] */}
  <span className="truncate">
    <span className="inline-flex items-center gap-1">
      {/* راست: متن مرحله */}
            <span>{levelInfo.level}</span>

      <span>{t("level")}</span>
      {/* چپ: عدد مرحله */}
    </span>
  </span>
</div>

                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-300 transition-all"
                    style={{ width: `${levelInfo.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score – جام سمت چپ، عدد وسط، ربات (rank) سمت راست */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex w-full items-center rounded-2xl border border-amber-300/40 bg-black/60 px-2 py-1 text-[11px] text-amber-50 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
                {/* آیکن جام مثل قبل (به‌جای متن Score) سمت چپ */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/40 via-amber-300/20 to-transparent shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                  <img
                    src={cupIcon}
                    alt={t("scoresLabel")}
                    className="h-4 w-4 object-contain"
                  />
                </div>

                {/* عدد وسط */}
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-[12px] font-semibold">
                    {formatNumber(progress.points)}
                  </span>
                </div>

                {/* آیکن Rank / ربات سمت راست */}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 via-emerald-300/20 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                  <img
                    src={rankIcon} // اینجا آیکن ربات یا آیکن رنکت
                    alt="rank"
                    className="h-4 w-4 object-contain"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    {/* Dialog تنظیمات – کنترل‌شده با settingsOpen */}
    <MenuSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

    {/* Level-up Modal */}
    {showLevelUp !== null && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
          <div className="mb-3 text-4xl">🎉</div>
          <h2 className="mb-2 font-cinzel text-2xl text-primary">
            {t("levelUpTitle")}
          </h2>
          <p className="mb-6 text-muted-foreground">
            {t("levelUpMessage")} {showLevelUp}
          </p>
          <button
            onClick={() => setShowLevelUp(null)}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            {t("continueLabel")}
          </button>
        </div>
      </div>
    )}
  </>
);
}