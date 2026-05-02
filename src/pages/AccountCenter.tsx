import { useEffect, useState } from "react";
import { Copy, LogOut, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppPageShell from "@/components/game/AppPageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

import { readPlayerExtras, updatePlayerExtras } from "@/lib/playerExtras";
import { GAME_CATALOG } from "@/lib/gameCatalog";
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import { getWinRate, readPlayerAnalytics } from "@/lib/playerAnalytics";
import { getUserCode } from "@/lib/social";
import { getLevelFromXp, getLevelProgress, readProgress } from "@/lib/progression";

import avatarArt from "@/assets/avatar.png";
import fireArt from "@/assets/fire.png";

// اگر type برای t سخت‌گیر است، این helper کمک می‌کند fallback داشته باشیم
function useSafeT() {
  const { t, dir } = useLanguage();
  const safeT = (key: string, fallback: string) => {
    const value = t(key as any);
    return value && value !== key ? value : fallback;
  };
  return { t, dir, safeT };
}

export default function AccountCenter() {
  const { user, logout, updateProfile } = useAuth();
  const { t, dir, safeT } = useSafeT();
  const navigate = useNavigate();

  const [extras, setExtras] = useState(() => readPlayerExtras(user?.id));
  const userCode = getUserCode(user?.id);
  const progress = readProgress(user?.id);
  const [analytics, setAnalytics] = useState(() => readPlayerAnalytics(user?.id));

  // XP و Level و Rank
  const level = getLevelFromXp(progress.xp);
  const xp = progress.xp || 0;

  const { currentXp, requiredXp, percent } = getLevelProgress(xp);
  const xpForNextLevel = requiredXp;
  const xpPercent = Math.min(100, Math.round(percent));

  // Rank ساده بر اساس level
  const rank =
    level >= 20 ? "Diamond" :
    level >= 15 ? "Platinum" :
    level >= 10 ? "Gold" :
    level >= 5  ? "Silver" :
    "Bronze";

  const normalizeAvatar = (avatar?: string) =>
    !avatar || avatar.includes("placeholder.svg") ? avatarArt : avatar;

  const avatarGallery = (
    extras.avatars.length > 0
      ? extras.avatars
      : [extras.selectedAvatar || avatarArt]
  ).map(normalizeAvatar);

  const stickerGallery =
    extras.stickers.length > 0 ? extras.stickers : ["default-fire"];

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [editMessage, setEditMessage] = useState<string | null>(null);

  // Sync extras با localStorage
  useEffect(() => {
    const syncExtras = () => setExtras(readPlayerExtras(user?.id));
    const syncAnalytics = () => setAnalytics(readPlayerAnalytics(user?.id));
    syncExtras();
    syncAnalytics();

    window.addEventListener("splendor-player-extras-updated", syncExtras);
    window.addEventListener("splendor-analytics-updated", syncAnalytics);
    window.addEventListener("storage", syncExtras);
    window.addEventListener("storage", syncAnalytics);

    return () => {
      window.removeEventListener("splendor-player-extras-updated", syncExtras);
      window.removeEventListener("splendor-analytics-updated", syncAnalytics);
      window.removeEventListener("storage", syncExtras);
      window.removeEventListener("storage", syncAnalytics);
    };
  }, [user?.id]);

  // Sync username/email وقتی user عوض می‌شود
  useEffect(() => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
  }, [user?.email, user?.username]);

  return (
    <AppPageShell currentPath="/menu" showHeader={false} backgroundImage={shellBackgrounds.accountCenter}>
      <div
        className="space-y-6 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.08),transparent_55%),linear-gradient(145deg,#020617,#020617,#020617)] px-2 py-4 sm:px-4 sm:py-6"
        dir={dir}
      >
        {/* کارت اصلی پروفایل */}
        <div className="rounded-[32px] border border-primary/25 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
          {/* هدر کارت */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/menu")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-black/40 text-primary shadow-lg shadow-black/70"
            >
              <X className="h-4 w-4" />
            </button>

            <h1 className="flex-1 text-center font-cinzel text-2xl sm:text-3xl tracking-[0.08em] text-primary">
              {t("accountCenterTitle")}
            </h1>

            <button
              onClick={() => navigate("/shop")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-black/40 text-primary shadow-lg shadow-black/70"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* بدنه کارت: آواتار، لول، XP، Rank و اطلاعات کاربر */}
          <div
            className={`flex flex-col gap-4 sm:flex-row sm:items-start ${
              dir === "rtl" ? "sm:flex-row-reverse text-right" : ""
            }`}
          >
            {/* ستون آواتار + Level Badge */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              {/* فریم آواتار تزئینی */}
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-[3px] shadow-[0_0_30px_rgba(245,158,11,0.7)]">
                <div className="h-full w-full rounded-full bg-slate-950/90 p-[3px]">
                  <Avatar className="h-full w-full rounded-full border border-amber-200/60 shadow-inner shadow-black/70">
                    <AvatarImage
                      src={normalizeAvatar(extras.selectedAvatar)}
                      alt={user?.username || t("guest")}
                    />
                    <AvatarFallback className="bg-slate-900 text-lg font-semibold text-amber-200">
                      {(user?.username || t("guest")).slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Level Badge روی فریم آواتار */}
                <div className="absolute -bottom-1 right-1 left-1 mx-auto flex w-[64%] items-center justify-center rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 px-2 py-[2px] text-[11px] font-semibold text-slate-900 shadow-[0_4px_14px_rgba(0,0,0,0.7)]">
                  <span className="uppercase tracking-wide">
                    {t("level")} {level}
                  </span>
                </div>
              </div>

              {/* Rank Badge */}
              <div className="rounded-full border border-amber-300/40 bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-amber-200">
                {safeT("rankLabel", "Rank")}: {rank}
              </div>
            </div>

            {/* ستون اطلاعات و نوار XP */}
            <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
              {/* نام، ایمیل، عضویت */}
              <div>
                <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                  {user?.username || t("guest")}
                </h2>
                <p className="text-xs text-slate-300/80 sm:text-sm">
                  {user?.email || t("noEmailSaved")}
                </p>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {t("memberSince")}:{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300/90">
                  <span className="uppercase tracking-widest text-amber-200">
                    XP
                  </span>
                  <span>
                    {currentXp} / {xpForNextLevel}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/80 shadow-inner shadow-black/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 shadow-[0_0_18px_rgba(251,191,36,0.9)] transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Info line: Score / Coins / Gems / Level */}
              <div
                className={`mt-2 flex flex-wrap gap-2 text-[11px] sm:text-xs ${
                  dir === "rtl" ? "justify-end" : "justify-start"
                } text-slate-300/90`}
              >
                <span className="rounded-full bg-black/50 px-3 py-1">
                  {t("scoresLabel")}:{" "}
                  <span className="font-semibold text-slate-50">
                    {progress.points}
                  </span>
                </span>
                <span className="rounded-full bg-black/50 px-3 py-1">
                  {t("coinsLabel")}:{" "}
                  <span className="font-semibold text-amber-300">
                    {progress.coins}
                  </span>
                </span>
                <span className="rounded-full bg-black/50 px-3 py-1">
                  {t("gemsLabel")}:{" "}
                  <span className="font-semibold text-sky-300">
                    {extras.gems}
                  </span>
                </span>
                <span className="rounded-full bg-black/50 px-3 py-1">
                  {t("level")}:{" "}
                  <span className="font-semibold text-emerald-300">
                    {level}
                  </span>
                </span>
              </div>

              {/* User Code + Copy */}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(userCode);
                }}
                className={`mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-black/50 px-3 py-1 text-[11px] font-medium text-amber-100 shadow-[0_6px_20px_rgba(0,0,0,0.7)] ${
                  dir === "rtl" ? "flex-row-reverse" : ""
                }`}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="uppercase tracking-widest">
                  {t("userCode")}: {userCode}
                </span>
              </button>

              {/* دکمه‌های Edit + Back */}
              <div
                className={`mt-4 flex flex-wrap justify-center gap-3 sm:justify-start ${
                  dir === "rtl" ? "sm:flex-row-reverse" : ""
                }`}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowEditProfile(true)}
                  className="border-amber-300/60 bg-black/40 text-amber-200 hover:bg-amber-400/10"
                >
                  {t("editProfile")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/menu")}
                  className="border-slate-500/70 bg-black/40 text-slate-200 hover:bg-slate-500/10"
                >
                  {t("backToMenu")}
                </Button>
              </div>

              {/* Achievements */}
              <div className="mt-4 rounded-2xl border border-slate-500/40 bg-black/50 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-slate-200">
                  <span className="font-semibold uppercase tracking-[0.2em] text-amber-200">
                    {safeT("achievementsLabel", "Achievements")}
                  </span>
                  {/* اینجا می‌تونی تعداد اچیومنت واقعی را بعداً اضافه کنی */}
                  {/* <span className="text-slate-400">5 / 20</span> */}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-xs shadow-[0_0_12px_rgba(15,23,42,0.9)]"
                    >
                      <span className="text-amber-200">★</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_36%),linear-gradient(145deg,rgba(2,6,23,0.96),rgba(15,23,42,0.98))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
          <div className={`flex items-center justify-between gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <div>
              <h2 className="font-cinzel text-2xl text-sky-100">Player Analytics</h2>
              <p className="mt-1 text-sm text-slate-400">Track win rate, played games, and total activity.</p>
            </div>
            <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-200/70">Overall Win Rate</p>
              <p className="font-cinzel text-3xl text-sky-100">{getWinRate({ played: analytics.totalGamesPlayed, wins: analytics.totalWins })}%</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Games Played</p>
              <p className="mt-2 font-cinzel text-3xl text-white">{analytics.totalGamesPlayed}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Wins</p>
              <p className="mt-2 font-cinzel text-3xl text-emerald-300">{analytics.totalWins}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Total Activity</p>
              <p className="mt-2 font-cinzel text-3xl text-amber-200">{analytics.totalPlayerActivity}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {GAME_CATALOG.map((game) => {
              const gameStats = analytics.byGame[game.id] || { played: 0, wins: 0, losses: 0 };
              return (
                <div key={game.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-cinzel text-xl text-white">{game.name}</h3>
                      <p className="text-xs text-slate-400">{game.badge}</p>
                    </div>
                    <div className="rounded-full bg-white/5 px-3 py-1 text-sm text-sky-200">
                      {getWinRate(gameStats)}% win
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full bg-white/5 px-3 py-1">Played: {gameStats.played}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">Wins: {gameStats.wins}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1">Losses: {gameStats.losses}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* آواتارها و استیکرها */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* کارت آواتارها */}
          <div className="rounded-3xl border border-slate-600/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
            <h3
              className={`font-semibold text-amber-200 ${
                dir === "rtl" ? "text-right" : ""
              }`}
            >
              {t("avatarsLabel")}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {avatarGallery.map((avatar, index) => {
                const isSelected =
                  normalizeAvatar(extras.selectedAvatar) === avatar;

                return (
                  <button
                    key={`${avatar}-${index}`}
                    type="button"
                    onClick={() =>
                      updatePlayerExtras(user?.id, (current) => ({
                        ...current,
                        selectedAvatar: normalizeAvatar(avatar),
                      }))
                    }
                    className={`group overflow-hidden rounded-2xl border bg-black/40 p-[3px] transition-all ${
                      isSelected
                        ? "border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                        : "border-slate-600/60 hover:border-amber-300/60 hover:shadow-[0_0_18px_rgba(148,163,184,0.7)]"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden rounded-xl">
                      <img
                        src={avatar || avatarArt}
                        alt={t("profile")}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/25 via-transparent to-transparent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* کارت استیکرها */}
          <div className="rounded-3xl border border-slate-600/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
            <h3
              className={`font-semibold text-amber-200 ${
                dir === "rtl" ? "text-right" : ""
              }`}
            >
              {t("stickersLabel")}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {stickerGallery.map((sticker, index) => (
                <div
                  key={`${sticker}-${index}`}
                  className="flex items-center justify-center rounded-2xl border border-slate-500/60 bg-black/50 p-3 shadow-[0_0_16px_rgba(15,23,42,0.9)]"
                >
                  <img
                    src={fireArt}
                    alt={t("stickersLabel")}
                    className="h-16 w-16 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* دکمه خروج */}
        <div
          className={`flex ${
            dir === "rtl" ? "justify-start" : "justify-end"
          }`}
        >
          <Button
            variant="destructive"
            onClick={() => setShowLogoutConfirm(true)}
            className={`bg-red-700/90 hover:bg-red-600 ${
              dir === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>

        {/* پیام آپدیت پروفایل */}
        {editMessage && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {editMessage}
          </div>
        )}

        {/* دیالوگ خروج */}
        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logoutConfirmTitle")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("logoutConfirmStay")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                {t("logoutConfirmApprove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* دیالوگ ویرایش پروفایل */}
        <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
          <DialogContent dir={dir}>
            <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
              <DialogTitle>{t("editProfile")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("usernameLabel")}
                </label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={`w-full rounded-lg border border-primary/20 bg-card px-4 py-2 ${
                    dir === "rtl" ? "text-right" : ""
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("emailLabel")}
                </label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full rounded-lg border border-primary/20 bg-card px-4 py-2 ${
                    dir === "rtl" ? "text-right" : ""
                  }`}
                />
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  const ok = await updateProfile({
                    username: username.trim(),
                    email: email.trim(),
                  });
                  setEditMessage(
                    ok ? t("profileUpdated") : t("profileUpdateFailed"),
                  );
                  if (ok) setShowEditProfile(false);
                }}
              >
                {t("saveChanges")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppPageShell>
  );
}
