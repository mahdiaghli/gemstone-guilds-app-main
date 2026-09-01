import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import AppPageShell from "@/components/game/AppPageShell";
import { useLanguage } from "@/hooks/useLanguage";
import { GAME_CATALOG } from "@/lib/gameCatalog";
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import deadMansDrawImage from "@/assets/background-zirkhaki.png";
import splendorWidePoster from "@/assets/wide-poster-splendor.webp";
import splendorSquarePoster from "@/assets/poster-square-splendor (4).webp";
import deadMansDrawWidePoster from "@/assets/poster-wide-zirkhaki.webp";
import deadMansDrawSquarePoster from "@/assets/poster-square-zirkhaki.webp";
import totemImage from "@/assets/play with robots.webp";
import beastyBarImage from "@/assets/play with robots.webp";
import coupImage from "@/assets/card2.png";
import ticketImage from "@/assets/banner.webp";

const GAME_IMAGES: Record<string, string> = {
  splendor: splendorSquarePoster,
  "dead-mans-draw": deadMansDrawSquarePoster,
  totem: totemImage,
  "beasty-bar": beastyBarImage,
  coup: coupImage,
  "ticket-to-ride": ticketImage,
};

const FEATURED_POSTERS: Partial<
  Record<string, { wide: string; square: string }>
> = {
  splendor: {
    wide: splendorWidePoster,
    square: splendorSquarePoster,
  },
  "dead-mans-draw": {
    wide: deadMansDrawWidePoster,
    square: deadMansDrawSquarePoster,
  },
};

// عناوین فارسی بازی‌ها
const GAME_TITLES_FA: Record<string, string> = {
  splendor: "اسپلندور",
  "dead-mans-draw": "روخاکی",
  totem: "جنگل اسپید",
  "beasty-bar": "بیستی بار",
  coup: "کوپ",
  "ticket-to-ride": "تیکت تو راید",
};

export default function GamesList() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const openGameCard = (gameId: string) => {
    const destination = `/menu/${gameId}`;

    try {
      if (
        gameId === "splendor" &&
        localStorage.getItem("splendor-tutorial-completed") !== "true"
      ) {
        navigate(
          `/splendor-tutorial?first=1&returnTo=${encodeURIComponent(
            destination,
          )}`,
        );
        return;
      }

      if (
        gameId === "dead-mans-draw" &&
        localStorage.getItem("deadmansdraw-tutorial-completed") !== "true"
      ) {
        navigate(
          `/tutorial-deadmansdraw?first=1&returnTo=${encodeURIComponent(
            destination,
          )}`,
        );
        return;
      }
    } catch {
      // If storage is unavailable, fall back to the game menu.
    }

    navigate(destination);
  };

  const copy = useMemo(
    () =>
      lang === "fa"
        ? {
            play: "بازی",
          }
        : {
            play: "PLAY",
          },
    [lang],
  );

  return (
    <AppPageShell
      currentPath="/menu"
      backgroundImage={shellBackgrounds.gamesList}
    >
      <div className="space-y-3 sm:space-y-4">
        {GAME_CATALOG.map((game) => {
          const posters = FEATURED_POSTERS[game.id];
          const isFa = lang === "fa";
          const cardDir = isFa ? "rtl" : "ltr";

          const gameTitle = isFa
            ? GAME_TITLES_FA[game.id] ?? game.name
            : game.name;

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => openGameCard(game.id)}
              className="group relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/75 shadow-[0_24px_60px_rgba(2,6,23,0.45)] transition-all active:scale-[0.99] sm:hover:-translate-y-1 sm:hover:border-primary/50"
              dir={cardDir}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 transition-opacity group-hover:opacity-35"
                style={{
                  backgroundImage: `url(${
                    posters?.wide || GAME_IMAGES[game.id] || deadMansDrawImage
                  })`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(45deg, ${game.accentFrom}22, ${game.accentTo}16 58%, rgba(2,6,23,0.9))`,
                }}
              />
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="relative flex min-h-[168px] flex-col gap-4 p-4 sm:min-h-[184px] sm:p-5">
                {/* عنوان بازی */}
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h2
                      className={`text-2xl leading-tight text-white sm:text-3xl ${
                        isFa ? "text-right" : "text-left"
                      }`}
                    >
                      {gameTitle}
                    </h2>
                  </div>
                </div>

                {posters ? (
                  <div className="flex justify-end">
                    {/* اگر پوستر مربع خواستی اینجا اضافه کن */}
                  </div>
                ) : null}

                {/* ردیف پایین: "بازی" / "PLAY" و فلش */}
                <div
                  className="mt-auto flex items-center justify-end gap-2 border-t border-white/10 pt-3 text-sm font-cinzel tracking-[0.2em]"
                  style={{ color: game.accentFrom }}
                >
                  {isFa ? (
                    // حالت فارسی: "< بازی" در سمت راست
                    <>
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      <span>{copy.play}</span>
                    </>
                  ) : (
                    // حالت انگلیسی: "PLAY >"
                    <>
                      <span>{copy.play}</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </AppPageShell>
  );
}
