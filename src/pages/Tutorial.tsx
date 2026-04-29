import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import PageTopBar from "@/components/game/PageTopBar";
import { getGameById } from "@/lib/gameCatalog";
import { shellBackgrounds } from "@/lib/pageBackgrounds";

// تصاویر
import tutorialImg from "@/assets/tutorial.png";
import manualImg from "@/assets/manual.png";
import youtubeImg from "@/assets/youtube.png";
import aparatImg from "@/assets/aparat.png";
import goalImg from "@/assets/goal.png";
import diceImg from "@/assets/dice.png";
import cardImg from "@/assets/card.png";
import reserveImg from "@/assets/reserve.png";
import cupImg from "@/assets/cup.png";
import bagImg from "@/assets/bag of money.png";
import card2Img from "@/assets/card2.png";
import mindImg from "@/assets/mind.png";
import krakenImg from "@/assets/kraken.png";
import chestImg from "@/assets/chest.png";

// یک کارت عمومی برای منوی آموزش (گلاس + حاشیه رنگی)
function TutorialMenuCard({
  title,
  description,
  accent,
  icon,
  dir,
  onClick,
  as = "button",
  href,
}: {
  title: string;
  description: string;
  accent: "gold" | "orange" | "blue" | "purple";
  icon: string;
  dir: "rtl" | "ltr";
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
}) {
  const baseAccent: Record<typeof accent, string> = {
    gold: "border-amber-400/70 shadow-[0_0_18px_rgba(251,191,36,0.35)]",
    orange: "border-orange-400/65 shadow-[0_0_18px_rgba(251,146,60,0.35)]",
    blue: "border-sky-400/70 shadow-[0_0_18px_rgba(56,189,248,0.35)]",
    purple: "border-violet-400/70 shadow-[0_0_18px_rgba(129,140,248,0.35)]",
  };

  const TitleAccentColor: Record<typeof accent, string> = {
    gold: "text-amber-200",
    orange: "text-orange-300",
    blue: "text-sky-300",
    purple: "text-violet-300",
  };

  const Comp: any = as === "a" ? motion.a : motion.button;

  return (
    <Comp
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98, translateY: 0 }}
      onClick={onClick}
      href={href}
      target={as === "a" ? "_blank" : undefined}
      rel={as === "a" ? "noopener noreferrer" : undefined}
      className={cn(
        "group w-full rounded-3xl border bg-slate-950/75 px-4 py-4",
        "backdrop-blur-xl transition-all",
        "flex items-center gap-4",
        baseAccent[accent],
        "hover:bg-slate-900/90",
        dir === "rtl" ? "text-right" : "text-left"
      )}
    >
      {/* آیکن */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900/95">
        <img
          src={icon}
          alt={title}
          className="h-7 w-7 object-contain drop-shadow-[0_0_10px_rgba(15,23,42,0.8)]"
        />
      </div>

      {/* متن */}
      <div className={cn("flex-1", dir === "rtl" && "text-right")}>
        <p
          className={cn(
            "font-cinzel text-sm sm:text-base tracking-wider",
            TitleAccentColor[accent],
            "drop-shadow-[0_0_10px_rgba(15,23,42,0.9)]"
          )}
        >
          {title}
        </p>
        <p className="mt-1 text-xs sm:text-sm font-body text-slate-200/85">
          {description}
        </p>
      </div>
    </Comp>
  );
}

export default function Tutorial() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"menu" | "steps" | "manual">("menu");
  const { t, dir } = useLanguage();
  const gameId = searchParams.get("game");
  const game = getGameById(gameId);
  const isDeadMansDraw = game.id === "dead-mans-draw";
  const backPath = gameId ? `/menu/${game.id}` : "/menu";

  useEffect(() => {
    if (searchParams.get("first") === "1") {
      localStorage.removeItem("splendor-needs-tutorial");
      setMode("steps");
      setStep(0);
    }
  }, [searchParams]);

  const splendorSteps = [
    {
      title: t("tut1Title"),
      icon: goalImg,
      content: t("tut1Content"),
      tip: t("tut1Tip"),
    },
    {
      title: t("tut2Title"),
      icon: bagImg,
      content: t("tut2Content"),
      tip: t("tut2Tip"),
    },
    {
      title: t("tut3Title"),
      icon: cardImg,
      content: t("tut3Content"),
      tip: t("tut3Tip"),
    },
    {
      title: t("tut4Title"),
      icon: reserveImg,
      content: t("tut4Content"),
      tip: t("tut4Tip"),
    },
    {
      title: t("tut5Title"),
      icon: cupImg,
      content: t("tut5Content"),
      tip: t("tut5Tip"),
    },
  ];

  const deadMansDrawSteps = [
    {
      title: t("deadMansDrawTutorialStep1Title"),
      icon: goalImg,
      content: t("deadMansDrawTutorialStep1Body"),
      tip: t("deadMansDrawTutorialStep1Body"),
    },
    {
      title: t("deadMansDrawTutorialStep2Title"),
      icon: tutorialImg,
      content: t("deadMansDrawTutorialStep2Body"),
      tip: t("deadMansDrawTutorialStep2Body"),
    },
    {
      title: t("deadMansDrawTutorialStep3Title"),
      icon: diceImg,
      content: t("deadMansDrawTutorialStep3Body"),
      tip: t("deadMansDrawTutorialStep3Body"),
    },
    {
      title: t("deadMansDrawTutorialStep4Title"),
      icon: krakenImg,
      content: t("deadMansDrawTutorialStep4Body"),
      tip: t("deadMansDrawTutorialStep4Body"),
    },
    {
      title: t("deadMansDrawTutorialStep5Title"),
      icon: cardImg,
      content: t("deadMansDrawTutorialStep5Body"),
      tip: t("deadMansDrawTutorialStep5Body"),
    },
    {
      title: t("deadMansDrawTutorialStep6Title"),
      icon: cupImg,
      content: t("deadMansDrawTutorialStep6Body"),
      tip: t("deadMansDrawTutorialStep6Body"),
    },
    {
      title: t("deadMansDrawTutorialStep7Title"),
      icon: chestImg,
      content: t("deadMansDrawTutorialStep7Body"),
      tip: t("deadMansDrawTutorialStep7Body"),
    },
    {
      title: t("deadMansDrawTutorialStep8Title"),
      icon: mindImg,
      content: [
        t("deadMansDrawTutorialStep8Body"),
        "",
        t("deadMansDrawPowerLeCorsaireName"),
        t("deadMansDrawPowerLeCorsaireAbility"),
        "",
        t("deadMansDrawPowerMadamMargotName"),
        t("deadMansDrawPowerMadamMargotAbility"),
        "",
        t("deadMansDrawPowerGhallegarName"),
        t("deadMansDrawPowerGhallegarAbility"),
        "",
        t("deadMansDrawPowerScurvyPeteName"),
        t("deadMansDrawPowerScurvyPeteAbility"),
        "",
        t("deadMansDrawPowerZaharaName"),
        t("deadMansDrawPowerZaharaAbility"),
        "",
        t("deadMansDrawPowerGunnieName"),
        t("deadMansDrawPowerGunnieAbility"),
        "",
        t("deadMansDrawPowerBlackBonnieName"),
        t("deadMansDrawPowerBlackBonnieAbility"),
        "",
        t("deadMansDrawPowerSirLoveswordName"),
        t("deadMansDrawPowerSirLoveswordAbility"),
        "",
        t("deadMansDrawPowerSeamusQuinnName"),
        t("deadMansDrawPowerSeamusQuinnAbility"),
      ].join("\n"),
      tip: t("deadMansDrawTutorialStep8Body"),
    },
  ];

  const splendorManualSections = [
    { title: t("setupSection"), icon: tutorialImg, content: t("setupContent") },
    { title: t("turnSection"), icon: diceImg, content: t("turnContent") },
    {
      title: t("cardTypesSection"),
      icon: card2Img,
      content: t("cardTypesContent"),
    },
    {
      title: t("tokenRulesSection"),
      icon: bagImg,
      content: t("tokenRulesContent"),
    },
    {
      title: t("winConditionSection"),
      icon: cupImg,
      content: t("winConditionContent"),
    },
    {
      title: t("strategySection"),
      icon: mindImg,
      content: t("strategyContent"),
    },
  ];

  const deadMansDrawManualSections = [
    { title: t("deadMansDrawTutorialStep1Title"), icon: goalImg, content: t("deadMansDrawTutorialStep1Body") },
    { title: t("deadMansDrawTutorialStep2Title"), icon: tutorialImg, content: t("deadMansDrawTutorialStep2Body") },
    { title: t("deadMansDrawTutorialStep3Title"), icon: diceImg, content: t("deadMansDrawTutorialStep3Body") },
    { title: t("deadMansDrawTutorialStep4Title"), icon: krakenImg, content: t("deadMansDrawTutorialStep4Body") },
    { title: t("deadMansDrawTutorialStep5Title"), icon: cardImg, content: t("deadMansDrawTutorialStep5Body") },
    { title: t("deadMansDrawTutorialStep6Title"), icon: cupImg, content: t("deadMansDrawTutorialStep6Body") },
    { title: t("deadMansDrawTutorialStep7Title"), icon: chestImg, content: t("deadMansDrawTutorialStep7Body") },
    {
      title: t("deadMansDrawTutorialStep8Title"),
      icon: mindImg,
      content: [
        t("deadMansDrawTutorialStep8Body"),
        "",
        t("deadMansDrawPowerLeCorsaireName"),
        t("deadMansDrawPowerLeCorsaireAbility"),
        "",
        t("deadMansDrawPowerMadamMargotName"),
        t("deadMansDrawPowerMadamMargotAbility"),
        "",
        t("deadMansDrawPowerGhallegarName"),
        t("deadMansDrawPowerGhallegarAbility"),
        "",
        t("deadMansDrawPowerScurvyPeteName"),
        t("deadMansDrawPowerScurvyPeteAbility"),
        "",
        t("deadMansDrawPowerZaharaName"),
        t("deadMansDrawPowerZaharaAbility"),
        "",
        t("deadMansDrawPowerGunnieName"),
        t("deadMansDrawPowerGunnieAbility"),
        "",
        t("deadMansDrawPowerBlackBonnieName"),
        t("deadMansDrawPowerBlackBonnieAbility"),
        "",
        t("deadMansDrawPowerSirLoveswordName"),
        t("deadMansDrawPowerSirLoveswordAbility"),
        "",
        t("deadMansDrawPowerSeamusQuinnName"),
        t("deadMansDrawPowerSeamusQuinnAbility"),
      ].join("\n"),
    },
  ];

  const steps = isDeadMansDraw ? deadMansDrawSteps : splendorSteps;
  const manualSections = isDeadMansDraw ? deadMansDrawManualSections : splendorManualSections;

  const currentEntry = (mode === "steps" ? steps : manualSections)[step];

  const isRTL = dir === "rtl";

  return (
    <div
      dir={dir}
      className={cn(
        "min-h-screen w-full bg-cover bg-center",
        "relative flex flex-col items-center pb-6 pt-24 px-4"
      )}
      style={{ backgroundImage: `url(${shellBackgrounds.tutorial})` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.84),rgba(2,6,23,0.68))]" />
      {/* گرادیان بالای صفحه برای حس گیمی‌تر */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent" />

      <PageTopBar />

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* هدر – شبیه AboutUs اما با متن آموزش */}
        <div className="mb-6 flex items-center justify-between">
          {/* دکمه بستن */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl 
                       border border-amber-400/35 bg-slate-950/70 text-amber-300 
                       shadow-[0_0_16px_rgba(251,191,36,0.35)] transition-colors 
                       hover:bg-amber-400/10"
          >
            <span className="text-lg">✕</span>
          </Button>

          {/* عنوان + زیرعنوان */}
          <div className="flex-1 text-center">
            <h1 className="font-cinzel text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]">
              {t("tutorialTitle")}
            </h1>
            <div className="mx-auto mt-2 h-px w-16 rounded-full bg-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.7)]" />
            <p className="mt-2 text-xs sm:text-sm text-slate-200/80">
              {(isDeadMansDraw ? t("deadMansDrawTutorialIntro") : t("tutorialSubtitle")) ??
                (isRTL
                  ? "راه‌های مختلف برای یادگیری قوانین و استراتژی‌های بازی"
                  : "Different ways to learn the rules and strategies of the game")}
            </p>
          </div>

          {/* برای بالانس فلکس */}
          <div className="w-10" />
        </div>

        {/* بدنه */}
        {mode === "menu" ? (
          <div className="space-y-4">
            {/* آموزش مرحله به مرحله */}
            <TutorialMenuCard
              accent="gold"
              title={t("stepByStep")}
              description={t("stepByStepDesc")}
              icon={tutorialImg}
              dir={dir as "rtl" | "ltr"}
              onClick={() => {
                setMode("steps");
                setStep(0);
              }}
            />

            {/* دستورالعمل کامل بازی */}
            <TutorialMenuCard
              accent="orange"
              title={t("fullManual")}
              description={t("fullManualDesc")}
              icon={manualImg}
              dir={dir as "rtl" | "ltr"}
              onClick={() => {
                setMode("manual");
                setStep(0);
              }}
            />

            {/* آموزش یوتیوب */}
            <TutorialMenuCard
              accent="blue"
              title={t("youtubeTitle")}
              description={t("youtubeDesc")}
              icon={youtubeImg}
              dir={dir as "rtl" | "ltr"}
              as="a"
              href="https://www.youtube.com/watch?v=DheGfd3JKEI"
            />

            {/* آموزش آپارات */}
            <TutorialMenuCard
              accent="purple"
              title={t("aparatTitle")}
              description={t("aparatDesc")}
              icon={aparatImg}
              dir={dir as "rtl" | "ltr"}
              as="a"
              href="https://www.aparat.com/v/s740g92?refererRef=search"
            />

            {/* فوتر کوچک پیشنهادی */}
            <p className="mt-3 text-center text-[11px] text-slate-400/85">
              {isRTL
                ? "اگر تازه‌کار هستید، از «آموزش مرحله به مرحله» شروع کنید."
                : "If you're new, start with the step-by-step interactive tutorial."}
            </p>
          </div>
        ) : (
          <div className="mt-2">
            {/* نوار دات‌ها / مراحل */}
            <div className="mb-5 flex justify-center gap-1.5 overflow-x-auto pb-2">
              {(mode === "steps" ? steps : manualSections).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    "bg-slate-700/70 backdrop-blur-sm",
                    i === step
                      ? "w-7 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                      : i < step
                      ? "w-4 bg-amber-300/60"
                      : "w-3 bg-slate-500/80"
                  )}
                />
              ))}
            </div>

            {/* کارت محتوای مرحله / بخش */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: isRTL ? -24 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 24 : -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "rounded-3xl border border-amber-400/25 bg-slate-950/85 p-6",
                  "backdrop-blur-xl shadow-[0_0_30px_rgba(15,23,42,0.95)]",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/95">
                    <img
                      src={currentEntry.icon}
                      alt={currentEntry.title}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <h2
                    className={cn(
                      "flex-1 font-cinzel text-xl sm:text-2xl text-amber-300 tracking-wider",
                      "drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {currentEntry.title}
                  </h2>
                </div>

                <p className="mb-4 whitespace-pre-line text-sm sm:text-base leading-relaxed font-body text-slate-100/90">
                  {currentEntry.content}
                </p>

                {mode === "steps" && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={goalImg}
                        alt="tip"
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                      <p className="text-xs sm:text-sm font-body text-emerald-50/90">
                        {steps[step].tip}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* دکمه‌های پایین */}
            <div className="mt-5 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => (step > 0 ? setStep(step - 1) : setMode("menu"))}
                className="flex-1 rounded-2xl border border-slate-600/50 bg-slate-900/70 text-slate-100 hover:bg-slate-800"
              >
                {step > 0 ? t("prev") : t("back")}
              </Button>

              <Button
                variant="game"
                onClick={() =>
                  step <
                  (mode === "steps" ? steps : manualSections).length - 1
                    ? setStep(step + 1)
                    : navigate(backPath)
                }
                className="flex-1 rounded-2xl bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.8)] hover:bg-amber-300"
              >
                {step < (mode === "steps" ? steps : manualSections).length - 1
                  ? t("next")
                  : t("startPlaying")}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
