import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { hasActivePremium } from "@/lib/shop";
import { requirePremium } from "@/lib/featureFlags";
import { AIDifficulty } from "@/lib/aiPlayer";
import { Button } from "@/components/ui/button";
import PageTopBar from "@/components/game/PageTopBar";
import easyIcon from "@/assets/easy game.webp";
import mediumIcon from "@/assets/medium game.webp";
import hardIcon from "@/assets/hard game.webp";
import { getGameById } from "@/lib/gameCatalog";
import { getPageBackground } from "@/lib/pageBackgrounds";
import { prepareOnlineMatchmaking } from "@/lib/onlineMatchmakingStart";

type GameMode = "ai" | "local" | "online";

export default function ModeSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, dir } = useLanguage();
  const { user } = useAuth();

  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const onlineStartedRef = useRef(false);

  // LOCAL
  const [localPlayerCount, setLocalPlayerCount] = useState(2);
  const [localHumanPlayers, setLocalHumanPlayers] = useState(2);

  // AI – تعداد بازیکن انتخاب‌شده
  const [aiPlayers, setAiPlayers] = useState<2 | 3 | 4>(2);

  // زمان نوبت (۱۵ / ۳۰ / ۴۵ / ۶۰ ثانیه)
  const [turnTime, setTurnTime] = useState<15 | 30 | 45 | 60>(15);

  const mode = useMemo(
    () => (searchParams.get("mode") || "local") as GameMode,
    [searchParams],
  );
  const premiumRequired = requirePremium() && (mode === "local" || mode === "online") && !hasActivePremium(user?.id);

  const selectedGame = useMemo(
    () => getGameById(searchParams.get("game")),
    [searchParams],
  );

  const isDeadMansDraw = selectedGame.id === "dead-mans-draw";

  const pageBackground = useMemo(
    () => getPageBackground(selectedGame.id, "mode-setup"),
    [selectedGame.id],
  );

  useEffect(() => {
    if (!["ai", "local", "online"].includes(mode)) {
      navigate(`/menu/${selectedGame.id}`);
    }
  }, [mode, navigate, selectedGame.id]);

  useEffect(() => {
    if (premiumRequired) {
      navigate("/shop?section=premium&reason=premium-required", { replace: true });
    }
  }, [navigate, premiumRequired]);

  useEffect(() => {
    if (mode !== "online" || premiumRequired || onlineStartedRef.current) return;
    onlineStartedRef.current = true;

    const result = prepareOnlineMatchmaking(user?.id, selectedGame.id);
    if (!result.ok) {
      toast.error(
        dir === "rtl"
          ? `برای بازی آنلاین به ${result.required} سکه نیاز دارید.`
          : `You need ${result.required} coins to play online.`,
      );
      navigate(`/menu/${selectedGame.id}`, { replace: true });
      return;
    }

    navigate(result.path, { replace: true });
  }, [dir, mode, navigate, premiumRequired, selectedGame.id, user?.id]);

  const difficultyOptions: {
    id: AIDifficulty;
    label: string;
    emoji: string;
  }[] = [
    { id: "easy", label: t("easy"), emoji: easyIcon },
    { id: "medium", label: t("medium"), emoji: mediumIcon },
    { id: "hard", label: t("hard"), emoji: hardIcon },
  ];

  const handleLocalPlayerCountSelect = (selectedPlayers: number) => {
    setLocalPlayerCount(selectedPlayers);
    setLocalHumanPlayers((current) => Math.min(current, selectedPlayers));
  };

  const handleStartLocalGame = () => {
    const botCount = localPlayerCount - localHumanPlayers;
    const difficultyParam = botCount > 0 ? `&difficulty=${difficulty}` : "";

    navigate(
      `/game?players=${localPlayerCount}` +
        `&game=${selectedGame.id}` +
        `&mode=local` +
        `&humans=${localHumanPlayers}` +
        difficultyParam +
        (isDeadMansDraw ? "" : `&turnTime=${turnTime}`),
    );
  };

  const botCount = localPlayerCount - localHumanPlayers;

  // شروع بازی در حالت AI از روی state
  const handleStartAIGame = () => {
    navigate(
      `/game?players=${aiPlayers}&game=${selectedGame.id}&mode=ai&difficulty=${difficulty}${
        isDeadMansDraw ? "" : `&turnTime=${turnTime}`
      }`,
    );
  };

  if (mode === "online") return null;

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* پس زمینه */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pageBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-background/10" />

      <PageTopBar />

      {/* دکمه ضربدر از اینجا حذف شد */}

      <motion.div
        className="relative z-10 text-center px-4 pt-24 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* هدر: اسم بازی وسط + دکمه ضربدر در گوشه بالا کنار عنوان */}
        <div className="relative mb-5">
          {/* عنوان کاملاً وسط */}
          <h1 className="font-cinzel text-3xl md:text-4xl text-primary text-center">
            {selectedGame.name}
          </h1>

          {/* دکمه ضربدر؛ موقعیت بر اساس جهت زبان */}
          <button
            type="button"
            onClick={() => navigate(`/menu/${selectedGame.id}`)}
            className={cn(
              "absolute top-1 h-9 w-9 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-xl leading-none text-foreground shadow-md hover:bg-card hover:border-primary/70 transition-colors",
              dir === "rtl" ? "left-0" : "right-0",
            )}
            aria-label={t("menu")}
          >
            ×
          </button>
        </div>



        {/* AI MODE – درجه سختی + تعداد بازیکن + زمان نوبت + Start */}
        {mode === "ai" && (
          <div className="space-y-6 mt-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                {t("difficulty")}
              </p>
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDifficulty(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                    dir === "rtl" ? "flex-row-reverse text-right" : "text-left",
                    difficulty === opt.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : " bg-card/60 hover:border-primary/80",
                  )}
                >
                  <img
                    src={opt.emoji}
                    alt={opt.label}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="flex-1 font-cinzel">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Number of players */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                {t("numberOfPlayers") ?? "Number of players"}
              </p>
              <div className="flex gap-3 justify-center">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAiPlayers(count as 2 | 3 | 4)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 font-cinzel text-lg transition-all",
                      aiPlayers === count
                        ? "border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20"
                        : "bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Time – بالای دکمه شروع */}
            {!isDeadMansDraw && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                  {t("turnTimeLimit") ?? "Turn Time Limit"}
                </p>
                <div className="flex gap-3 justify-center">
                  {[15, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => setTurnTime(time as 15 | 30 | 45 | 60)}
                      className={cn(
                        "w-20 h-12 rounded-xl border-2 font-cinzel text-base transition-all",
                        turnTime === time
                          ? "border-primary bg-primary/20 text-foreground shadow-lg shadow-primary/30"
                          : "bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                      )}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start AI Game */}
            <Button
              variant="game"
              className="mt-2 h-14 w-full text-lg shadow-xl shadow-primary/30"
              onClick={handleStartAIGame}
            >
              {t("startGame") ?? "Start Game"}
            </Button>
          </div>
        )}

        {/* LOCAL MODE – ... (فقط offset بالایی کمی تغییر کرده) */}
        {mode === "local" && (
          <div className="space-y-5 mt-4">
            {/* Total Players */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                {t("totalPlayers")}
              </p>
              <div className="flex gap-3 justify-center">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleLocalPlayerCountSelect(count)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 font-cinzel text-lg transition-all",
                      localPlayerCount === count
                        ? "border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20"
                        : "bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Human Players */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                {t("humanPlayers")}
              </p>
              <div className="flex gap-3 justify-center">
                {Array.from(
                  { length: localPlayerCount },
                  (_, index) => index + 1,
                ).map((count) => (
                  <button
                    key={count}
                    onClick={() => setLocalHumanPlayers(count)}
                    className={cn(
                      "w-14 h-14 rounded-xl border-2 font-cinzel text-lg transition-all",
                      localHumanPlayers === count
                        ? "border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20"
                        : " bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Count */}
            <div className="rounded-xl border border-primary/20 bg-card/50 px-4 py-3 text-sm text-foreground">
              {t("botPlayers")}: {botCount}
            </div>

            {/* Bot Difficulty فقط وقتی Bot داریم */}
            <AnimatePresence initial={false}>
              {botCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-2 overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                    {t("botDifficulty")}
                  </p>
                  {difficultyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDifficulty(opt.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        dir === "rtl"
                          ? "flex-row-reverse text-right"
                          : "text-left",
                        difficulty === opt.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : " bg-card/60 hover:border-primary/80",
                      )}
                    >
                      <img
                        src={opt.emoji}
                        alt={opt.label}
                        className="h-8 w-8 object-contain"
                      />
                      <span className="flex-1 font-cinzel">{opt.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Turn Time – بالای دکمه شروع */}
            {!isDeadMansDraw && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                  {t("turnTimeLimit") ?? "Turn Time Limit"}
                </p>
                <div className="flex gap-3 justify-center">
                  {[15, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => setTurnTime(time as 15 | 30 | 45 | 60)}
                      className={cn(
                        "w-20 h-12 rounded-xl border-2 font-cinzel text-base transition-all",
                        turnTime === time
                          ? "border-primary bg-primary/20 text-foreground shadow-lg shadow-primary/30"
                          : "bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                      )}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Local Game */}
            <Button
              variant="game"
              className="mt-2 h-14 w-full text-lg shadow-xl shadow-primary/30"
              onClick={handleStartLocalGame}
            >
              {t("startLocalGame")}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
