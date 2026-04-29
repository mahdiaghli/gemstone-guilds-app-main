import AppPageShell from "@/components/game/AppPageShell";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function AboutUs() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const isRTL = dir === "rtl";

  return (
    <AppPageShell currentPath="/menu" showHeader={false}>
      <div className="flex min-h-full items-center justify-center px-4 pb-6 pt-4">
        {/* کارت اصلی About */}
        <div
          dir={dir}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-amber-400/25 
                     bg-slate-950/85 px-6 py-6 shadow-[0_0_45px_rgba(15,23,42,0.95)] 
                     backdrop-blur-xl sm:px-8 sm:py-7"
        >
          {/* دکمه بستن + عنوان */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/menu")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl 
                         border border-amber-400/35 bg-slate-900/70 text-amber-300 
                         shadow-[0_0_18px_rgba(251,191,36,0.25)] 
                         transition-colors hover:bg-amber-400/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex-1 text-center">
              <h1 className="font-cinzel text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                {t("aboutUsTitle")}
              </h1>
              <div className="mx-auto mt-2 h-px w-16 rounded-full bg-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.7)]" />
            </div>

            {/* برای بالانس فلکس */}
            <div className="w-10 shrink-0" />
          </div>

          {/* متن اصلی */}
          <div
            className={[
              "mt-3 space-y-4 text-[15px] sm:text-base leading-relaxed",
              "text-slate-100/90",
              isRTL ? "text-right" : "text-left",
            ].join(" ")}
          >
            <p>{t("aboutUsBody1")}</p>
            <p>{t("aboutUsBody2")}</p>
            <p>{t("aboutUsBody3")}</p>
          </div>

          {/* نوار نسخه / فوتر کوچک */}
          <div
            className={[
              "mt-6 flex items-center justify-between text-xs text-slate-400/80",
              isRTL ? "flex-row-reverse" : "flex-row",
            ].join(" ")}
          >
            <span>Gemstone Guilds</span>
            <span>Version 1.0.0</span>
          </div>

          {/* هاله طلایی ملایم پایین کارت – فقط تزئینی */}
          <div className="pointer-events-none absolute inset-x-16 -bottom-10 h-16 rounded-full bg-amber-400/20 blur-3xl" />
        </div>
      </div>
    </AppPageShell>
  );
}
