import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { getGameEntryFee, payGameEntryFee } from "@/lib/progression";
import { AIDifficulty } from "@/lib/aiPlayer";
import { Button } from "@/components/ui/button";
import PageTopBar from "@/components/game/PageTopBar";
import easyIcon from "@/assets/easy game.webp";
import mediumIcon from "@/assets/medium game.webp";
import hardIcon from "@/assets/hard game.webp";
import manualRoomIcon from "@/assets/manual.webp";
import matchmakingIcon from "@/assets/internet.webp";
import { getGameById } from "@/lib/gameCatalog";
import { getPageBackground } from "@/lib/pageBackgrounds";

type GameMode = "ai" | "local" | "online";

export default function ModeSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, dir } = useLanguage();
  const { user } = useAuth();

  const [onlineMode, setOnlineMode] = useState<"manual" | "matchmaking" | null>(
    null,
  );
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [entryError, setEntryError] = useState("");

  // LOCAL
  const [localPlayerCount, setLocalPlayerCount] = useState(2);
  const [localHumanPlayers, setLocalHumanPlayers] = useState(2);

  // AI – تعداد بازیکن انتخاب‌شده
  const [aiPlayers, setAiPlayers] = useState<2 | 3 | 4>(2);

  // زمان نوبت (۱۵ / ۳۰ / ۴۵ / ۶۰ ثانیه)
  const [turnTime, setTurnTime] = useState<15 | 30 | 45 | 60>(45);

  const mode = useMemo(
    () => (searchParams.get("mode") || "local") as GameMode,
    [searchParams],
  );

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

  const difficultyOptions: {
    id: AIDifficulty;
    label: string;
    emoji: string;
  }[] = [
    { id: "easy", label: t("easy"), emoji: easyIcon },
    { id: "medium", label: t("medium"), emoji: mediumIcon },
    { id: "hard", label: t("hard"), emoji: hardIcon },
  ];

  const startOnline = (
    selectedPlayers: number,
    selectedOnlineMode: "manual" | "matchmaking",
  ) => {
    const feeMode =
      selectedOnlineMode === "matchmaking" ? "onlineMatchmaking" : "onlineManual";
    const feeResult = payGameEntryFee(user?.id, feeMode);
    if (!feeResult.ok) {
      setEntryError(
        `You need ${feeResult.required} coins to enter online play.`,
      );
      return;
    }

    sessionStorage.setItem(
      "splendor-online-entry-fee",
      JSON.stringify({
        charged: feeResult.charged,
        feeMode,
        refunded: false,
      }),
    );
    setEntryError("");

    if (selectedOnlineMode === "manual") {
      navigate(
        `/online-lobby?players=${selectedPlayers}${
          isDeadMansDraw ? "" : "&turnTime=45"
        }&game=${selectedGame.id}`,
      );
      return;
    }

    sessionStorage.setItem("matchmaking-players", selectedPlayers.toString());
    if (isDeadMansDraw) {
      sessionStorage.removeItem("matchmaking-turnTime");
    } else {
      sessionStorage.setItem("matchmaking-turnTime", "45");
    }
    sessionStorage.setItem("matchmaking-game", selectedGame.id);

    navigate(`/online-matchmaking?game=${selectedGame.id}`);
  };

  // فقط برای ONLINE
  const handlePlayerSelectOnline = (selectedPlayers: number) => {
    if (mode === "online" && onlineMode) {
      startOnline(selectedPlayers, onlineMode);
    }
  };

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

  const handleOnlineModeSelect = (
    selectedOnlineMode: "manual" | "matchmaking",
  ) => {
    setOnlineMode(selectedOnlineMode);
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

        {/* ONLINE MODE – ... (بدون تغییر نسبت به قبلی) */}
        {mode === "online" && (
          <div className="space-y-6 mt-4">
            <div className="space-y-2 mb-2">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                Online Mode
              </p>
              <button
                onClick={() => handleOnlineModeSelect("manual")}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                  dir === "rtl" ? "flex-row-reverse text-right" : "text-left",
                  onlineMode === "manual"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : " bg-card/60 hover:border-primary/80",
                )}
              >
                <img
                  src={manualRoomIcon}
                  alt="manual"
                  className="h-8 w-8 object-contain"
                />
                <span className="flex-1 font-cinzel">Manual Room</span>
              </button>
              <button
                onClick={() => handleOnlineModeSelect("matchmaking")}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                  dir === "rtl" ? "flex-row-reverse text-right" : "text-left",
                  onlineMode === "matchmaking"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : " bg-card/60 hover:border-primary/80",
                )}
              >
                <img
                  src={matchmakingIcon}
                  alt="online"
                  className="h-8 w-8 object-contain"
                />
                <span className="flex-1 font-cinzel">Find Match</span>
              </button>
              <p className="text-xs text-muted-foreground">
                Online entry fee: {getGameEntryFee("onlineManual")} coins
              </p>
              {entryError ? (
                <p className="text-sm text-red-300">{entryError}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-cinzel tracking-widest">
                {t("numberOfPlayers") ?? "Number of players"}
              </p>
              <div className="flex gap-3 justify-center">
                {[2, 3, 4].map((count) => {
                  const disabled = !onlineMode;
                  return (
                    <button
                      key={count}
                      onClick={() => handlePlayerSelectOnline(count)}
                      disabled={disabled}
                      className={cn(
                        "w-14 h-14 rounded-xl border-2 font-cinzel text-lg transition-all",
                        disabled
                          ? "border-border/30 text-muted-foreground/50 cursor-not-allowed"
                          : "border-primary/60 bg-card/75 text-foreground shadow-md shadow-black/10 hover:border-primary hover:bg-primary/10",
                      )}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isDeadMansDraw && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
                {t("turnTimeLimit") ?? "Turn Time Limit"}: 45s
              </div>
            )}
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
