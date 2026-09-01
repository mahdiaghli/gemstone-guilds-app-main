import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import PageTopBar from "@/components/game/PageTopBar";
import AppBottomNav from "@/components/game/AppBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { hasActivePremium } from "@/lib/shop";
import robotIcon from "@/assets/play with robots.webp";
import localIcon from "@/assets/two player.webp";
import onlineIcon from "@/assets/internet.webp";
import tutorialIcon from "@/assets/manual.webp";
import { findGameById, getGameById } from "@/lib/gameCatalog";
import { getPageBackground } from "@/lib/pageBackgrounds";

const GEM_DECORATIONS = [
  { emoji: "\ud83d\udc8e", x: "15%", y: "20%", delay: 0 },
  { emoji: "\ud83d\udd34", x: "80%", y: "15%", delay: 0.5 },
  { emoji: "\ud83d\udfe2", x: "10%", y: "70%", delay: 1 },
  { emoji: "\ud83d\udd35", x: "85%", y: "65%", delay: 1.5 },
  { emoji: "\u26ab", x: "50%", y: "10%", delay: 2 },
];

export default function Index() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const game = getGameById(gameId);
  const pageBackground = getPageBackground(game.id, "index");
  const gameTitleFa = game.id === "dead-mans-draw" ? "روخاکی" : game.name;

  useEffect(() => {
    if (gameId && !findGameById(gameId)) {
      navigate("/menu", { replace: true });
    }
  }, [gameId, navigate]);

  const openSplendorDestination = (targetPath: string) => {
    const requiresPremium =
      targetPath.includes("mode=local") || targetPath.includes("mode=online");

    if (requiresPremium && !hasActivePremium(user?.id)) {
      navigate("/shop?section=premium&reason=premium-required");
      return;
    }

    if (game.id !== "splendor") {
      navigate(targetPath);
      return;
    }

    const tutorialCompleted =
      localStorage.getItem("splendor-tutorial-completed") === "true";
    if (!tutorialCompleted) {
      navigate(
        `/splendor-tutorial?first=1&returnTo=${encodeURIComponent(targetPath)}`,
      );
      return;
    }

    navigate(targetPath);
  };

  const menuItems = [
    {
      id: "ai" as const,
      icon: robotIcon,
      title: t("playWithAI"),
      subtitle: t("playWithAIDesc"),
      action: () => openSplendorDestination(`/mode-setup?mode=ai&game=${game.id}`),
    },
    {
      id: "local" as const,
      icon: localIcon,
      title: t("localPlay"),
      subtitle: t("localPlayDesc"),
      action: () => openSplendorDestination(`/mode-setup?mode=local&game=${game.id}`),
    },
    {
      id: "online" as const,
      icon: onlineIcon,
      title: t("onlinePlay"),
      subtitle: t("onlinePlayDesc"),
      action: () => openSplendorDestination(`/mode-setup?mode=online&game=${game.id}`),
    },
    {
      id: "tutorial" as const,
      icon: tutorialIcon,
      title: t("tutorial"),
      subtitle: t("tutorialDesc"),
      action: () => navigate(`/tutorial?game=${game.id}`),
    },
  ];

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pb-28"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pageBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-background/10" />

      {GEM_DECORATIONS.map((gem, i) => (
        <span
          key={i}
          className="absolute text-2xl md:text-3xl opacity-20 pointer-events-none"
          style={{ left: gem.x, top: gem.y }}
        >
          {gem.emoji}
        </span>
      ))}

      <PageTopBar />

      <div className="relative z-10 mt-28 w-full max-w-md px-4 text-center md:mt-32">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/55 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label="Close game menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h1 className="font-cinzel text-4xl md:text-6xl text-primary tracking-[0.18em] mb-2">
          {dir === "rtl" ? gameTitleFa : game.name}
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-3" />
        {/* <p className="text-muted-foreground text-sm md:text-base font-body tracking-wider mb-2"> */}
          {/* {t("subtitle")} */}
        {/* </p> */}
        {/* <p className="text-[11px] uppercase tracking-[0.35em] text-primary/70 mb-8"> */}
          {/* {game.subtitle} */}
        {/* </p> */}

        <div className="space-y-3 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 transition-all",
                item.id === "tutorial" ? "px-3 py-2" : "p-4",
                dir === "rtl" ? "text-right flex-row-reverse" : "text-left",
                "border-border/50 bg-card/50 hover:border-primary/30",
              )}
            >
              <img src={item.icon} alt={item.title} className={item.id === "tutorial" ? "h-8 w-8 object-contain" : "h-10 w-10 object-contain"} />
              <div className="flex-1">
                <p
                  className={cn(
                    item.id === "tutorial" ? "font-cinzel text-xs tracking-wider" : "font-cinzel text-sm tracking-wider",
                    "text-foreground",
                  )}
                >
                  {item.title}
                </p>
                <p className={cn("text-muted-foreground font-body", item.id === "tutorial" ? "text-[11px]" : "text-xs")}>
                  {item.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* <p className="absolute bottom-6 text-[11px] text-muted-foreground/40 font-body tracking-wider"> */}
        {/* {t("attribution")} */}
      {/* </p> */}

      <AppBottomNav currentPath="/menu" />
    </div>
  );
}
