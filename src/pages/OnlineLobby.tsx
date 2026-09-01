import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import PageTopBar from '@/components/game/PageTopBar';
import { getGameById, getGameMenuPath } from '@/lib/gameCatalog';
import { refundPendingEntryFee } from '@/lib/onlineEntryFee';
import { getPageBackground } from '@/lib/pageBackgrounds';

// Simple UUID v4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
export default function OnlineLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, dir } = useLanguage();
  const selectedGame = getGameById(searchParams.get("game"));
  const menuPath = getGameMenuPath(searchParams.get("game"));
  const { user } = useAuth();
  const pageBackground = getPageBackground(selectedGame.id, "manual-room");

  const playerName = user?.username || "";
  const [roomCode, setRoomCode] = useState("");
  const [generatedRoom, setGeneratedRoom] = useState("");
  const [copied, setCopied] = useState(false);

  // تعداد بازیکنان از کوئری‌پارام
  const playerCount = (() => {
    const raw = Number(searchParams.get("players"));
    return raw >= 2 && raw <= 4 ? raw : 2;
  })();
  const turnTime = (() => {
    const raw = Number(searchParams.get("turnTime"));
    return raw === 15 || raw === 30 || raw === 45 || raw === 60 ? raw : 15;
  })();
  const targetScore = (() => {
    const raw = Number(searchParams.get("targetScore"));
    return raw > 0 ? raw : undefined;
  })();

  useEffect(() => {
    localStorage.removeItem("splendor-online-room");
  }, []);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoom(code);
  };

  const copyToClipboard = async () => {
    if (!generatedRoom) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedRoom);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = generatedRoom;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy room code", error);
    }
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert(t("loginFirst"));
      return;
    }
    if (!generatedRoom) {
      generateRoomCode();
      return;
    }

    const playerId = generateUUID();

    localStorage.setItem(
      "splendor-online-room",
      JSON.stringify({
        roomId: generatedRoom,
        playerId,
        playerName,
        isHost: true,
        playerCount,
        turnTime,
        targetScore,
        gameId: selectedGame.id,
      })
    );

    navigate(`/online-game/${generatedRoom}?player=${playerId}&game=${selectedGame.id}`);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert(t("loginFirst"));
      return;
    }
    if (!roomCode.trim()) {
      alert(t("enterRoomCodeAlert"));
      return;
    }

    const playerId = generateUUID();
    const normalizedCode = roomCode.toUpperCase();

    localStorage.setItem(
      "splendor-online-room",
      JSON.stringify({
        roomId: normalizedCode,
        playerId,
        playerName,
        isHost: false,
        turnTime,
        targetScore,
        gameId: selectedGame.id,
      })
    );

    navigate(`/online-game/${normalizedCode}?player=${playerId}&game=${selectedGame.id}`);
  };

  const isRtl = dir === "rtl";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24 pb-8"
      dir={dir}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pageBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#05040A]/84 via-[#14111F]/80 to-[#05040A]/88" />
      <PageTopBar />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md space-y-7"
      >
        {/* Header: Splendor + Online Play */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cinzel font-bold tracking-[0.2em] text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]">
            {selectedGame.name}
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">
            {t("onlinePlay")}
          </p>
        </div>

        {/* Player bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >

        </motion.div>

        {/* Create Room Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-cinzel text-lg text-amber-300">
              {t("createRoomTitle")}
            </h2>
            <span className="text-[11px] text-amber-100/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {t("playersCount", { count: playerCount })}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("createRoomHint")}
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground/80">
              {t("roomCode")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("generateCode")}
                value={generatedRoom}
                readOnly
                className="flex-1 rounded-lg border border-amber-500/30 bg-slate-950/60 px-4 py-2.5 text-center font-mono text-sm tracking-[0.35em] text-amber-100 placeholder:text-xs placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-400/80 focus:border-transparent"
              />
              <button
                type="button"
                onClick={generateRoomCode}
                className="px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-400/30 text-amber-200 font-cinzel text-sm shadow-[0_0_14px_rgba(251,191,36,0.55)] transition-colors"
              >
                🎲
              </button>
            </div>

            {generatedRoom && (
              <button
                type="button"
                onClick={copyToClipboard}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all border
                  ${
                    copied
                      ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-100"
                      : "bg-transparent border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                  }`}
              >
                {copied ? t("copiedCode") : t("copyCode")}
              </button>
            )}
          </div>

          <Button
            onClick={handleCreateRoom}
            variant="game"
            disabled={!playerName.trim()}
            className="w-full font-cinzel tracking-[0.2em] uppercase shadow-[0_0_22px_rgba(251,191,36,0.8)] disabled:shadow-none"
          >
            {t("createRoomAction")}
          </Button>
        </motion.div>

        {/* OR separator */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/80">
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-500/60 to-transparent" />
          <span className="uppercase tracking-[0.4em] text-[10px]">
            {t("or")}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-500/60 to-transparent" />
        </div>

        {/* Join Room Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-cinzel text-lg text-emerald-300">
              {t("joinRoomTitle")}
            </h2>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("joinRoomHint")}
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground/80">
              {t("roomCode")}
            </label>
            <input
              type="text"
              placeholder={t("enterRoomCode")}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full rounded-lg border border-emerald-500/30 bg-slate-950/60 px-4 py-2.5 text-center font-mono text-sm tracking-[0.35em] text-emerald-100 placeholder:text-xs placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/80 focus:border-transparent"
            />
          </div>

          <Button
            onClick={handleJoinRoom}
            variant="game-secondary"
            disabled={!playerName.trim() || !roomCode.trim()}
            className="w-full font-cinzel tracking-[0.2em] uppercase shadow-[0_0_18px_rgba(52,211,153,0.6)] disabled:shadow-none"
          >
            {t("joinRoomAction")}
          </Button>
        </motion.div>

        {/* Back button */}
        <Button
          onClick={() => {
            refundPendingEntryFee(user?.id);
            navigate(menuPath);
          }}
          variant="ghost"
          className="w-full mt-2 text-muted-foreground hover:text-foreground text-xs"
        >
          {isRtl ? `${t("menu")} ←` : `← ${t("menu")}`}
        </Button>
      </motion.div>
    </div>
  );
}
