import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import AppPageShell from "@/components/game/AppPageShell";
import { useLanguage } from "@/hooks/useLanguage";
import { GAME_CATALOG } from "@/lib/gameCatalog";
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import deadMansDrawImage from "@/assets/background-zirkhaki.png";
import splendorWidePoster from "@/assets/wide-poster-splendor.png";
import splendorSquarePoster from "@/assets/poster-square-splendor (4).png";
import deadMansDrawWidePoster from "@/assets/poster-wide-zirkhaki.png";
import deadMansDrawSquarePoster from "@/assets/poster-square-zirkhaki.png";
import totemImage from "@/assets/play with robots.png";
import azulImage from "@/assets/gem-blue.png";
import coupImage from "@/assets/card2.png";
import ticketImage from "@/assets/banner.png";

const GAME_IMAGES: Record<string, string> = {
  splendor: splendorSquarePoster,
  "dead-mans-draw": deadMansDrawSquarePoster,
  totem: totemImage,
  azul: azulImage,
  coup: coupImage,
  "ticket-to-ride": ticketImage,
};

const FEATURED_POSTERS: Partial<Record<string, { wide: string; square: string }>> = {
  splendor: {
    wide: splendorWidePoster,
    square: splendorSquarePoster,
  },
  "dead-mans-draw": {
    wide: deadMansDrawWidePoster,
    square: deadMansDrawSquarePoster,
  },
};

export default function GamesList() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const copy = useMemo(() => lang === "fa" ? {
    play: "بازی",
  } : {
    play: "PLAY",
  }, [lang]);

  return (
    <AppPageShell currentPath="/menu" backgroundImage={shellBackgrounds.gamesList}>
      <div className="space-y-3 sm:space-y-4">
        {GAME_CATALOG.map((game) => {
          const posters = FEATURED_POSTERS[game.id];

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => navigate(`/menu/${game.id}`)}
              className="group relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/75 text-left shadow-[0_24px_60px_rgba(2,6,23,0.45)] transition-all active:scale-[0.99] sm:hover:-translate-y-1 sm:hover:border-primary/50"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity group-hover:opacity-35"
                style={{ backgroundImage: `url(${posters?.wide || GAME_IMAGES[game.id] || deadMansDrawImage})` }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, ${game.accentFrom}22, ${game.accentTo}16 58%, rgba(2,6,23,0.9))`,
                }}
              />
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="relative flex min-h-[168px] flex-col gap-4 p-4 sm:min-h-[184px] sm:p-5">
                <div className="flex items-start gap-4">
                  {/* <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-2 shadow-[0_18px_30px_rgba(2,6,23,0.35)]"> */}
                    {/* <img src={GAME_IMAGES[game.id] || deadMansDrawImage} alt={game.name} className="h-20 w-20 object-contain sm:h-24 sm:w-24" /> */}
                  {/* </div> */}

                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="font-cinzel text-2xl leading-tight text-white sm:text-3xl">
                      {game.name}
                    </h2>
                    {/* <p className="text-sm leading-6 text-slate-200/75"> */}
                      {/* {game.subtitle} */}
                    {/* </p> */}
                  </div>
                </div>

                {posters ? (
                  <div className="flex justify-end">
                    {/* <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/25 shadow-[0_14px_30px_rgba(2,6,23,0.35)]">
                      <img
                        src={posters.square}
                        alt={`${game.name} square poster`}
                        className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                      />
                    </div> */}
                  </div>
                ) : null}

                <div className="mt-auto flex items-center justify-end gap-2 border-t border-white/10 pt-3 text-sm font-cinzel tracking-[0.2em]" style={{ color: game.accentFrom }}>
                  <span>{copy.play}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </AppPageShell>
  );
}
