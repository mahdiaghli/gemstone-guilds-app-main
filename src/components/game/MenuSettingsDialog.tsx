import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Music,
  UserCircle2,
  Volume2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useAudio } from "@/hooks/useAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useAuth } from "@/hooks/useAuth";
import { type Lang, useLanguage } from "@/hooks/useLanguage";

type MenuSettingsDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
};

export default function MenuSettingsDialog({
  open,
  onOpenChange,
}: MenuSettingsDialogProps) {
  const { t, lang, setLang, dir } = useLanguage();
  const { soundEffectsEnabled, toggleSoundEffects } = useAudio();
  const { isPlaying, toggleMusic } = useBackgroundMusic();
  const { user } = useAuth();
  const navigate = useNavigate();

  const labelAlign = dir === "rtl" ? "text-right" : "text-left";

  // فقط toggle بدون آرگومان
  const handleToggleMusic = () => {
    toggleMusic();
  };

  const handleToggleSfx = () => {
    toggleSoundEffects();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm rounded-[30px] border border-yellow-500/40 bg-gradient-to-b from-[#131a2a] via-[#050915] to-[#05060b] text-white shadow-[0_0_40px_rgba(0,0,0,0.9)]"
        dir={dir}
      >
        {/* HEADER */}
        <DialogHeader className="relative text-center pb-2">
          <DialogTitle className="text-lg font-semibold tracking-wide">
            {t("settings")}
          </DialogTitle>


        </DialogHeader>

        <div className="space-y-6 pt-1">
          {/* ACCOUNT SECTION */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/80">
    {t("accountSectionTitle")}
            </p>

            <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/90 shadow-[0_0_24px_rgba(15,23,42,0.8)] overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={() => navigate("/account")}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                    <UserCircle2 className="h-4 w-4 text-slate-100" />
                  </div>
                  <span className="text-sm">{t("profile")}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="flex w-full items-center justify-between border-t border-white/10 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={() => navigate("/about")}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                    <AlertCircle className="h-4 w-4 text-slate-100" />
                  </div>
                  <span className="text-sm">{t("aboutUs")}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* GAME & AUDIO */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/80">
    {t("gameSectionTitle")}
            </p>

            {/* LANGUAGE */}
            <div className="flex items-center justify-between">
              <p className={`text-sm ${labelAlign}`}>{t("language")}</p>

              <Select
                value={lang}
                onValueChange={(v) => setLang(v as Lang)}
              >
                <SelectTrigger className="w-[150px] border-yellow-500/40 bg-gradient-to-r from-slate-900/80 to-slate-700/80 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-slate-50 border-yellow-500/40">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fa">فارسی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GAME AUDIO CARD */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 px-4 py-3 shadow-[0_0_24px_rgba(15,23,42,0.9)] border border-slate-700/70 space-y-3">
              {/* Background Music */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-400/5 border border-yellow-500/40 shadow-[0_0_18px_rgba(250,204,21,0.4)]">
                    <Music className="h-4 w-4 text-yellow-300" />
                  </div>

                  <div className="leading-tight">
                    <p className="text-sm font-medium">
                      {t("backgroundMusic")}
                    </p>
                    <p className="text-xs mt-0.5 text-yellow-300">
                      {isPlaying ? "On" : "Off"}
                    </p>
                  </div>
                </div>

                <div dir="ltr">
                  <Switch
                    checked={isPlaying}
                    onCheckedChange={handleToggleMusic}
                    className={`
                      data-[state=checked]:bg-yellow-400
                      data-[state=checked]:shadow-[0_0_12px_rgba(250,204,21,0.9)]
                      data-[state=unchecked]:bg-slate-600
                      transition-all duration-200
                      hover:shadow-[0_0_16px_rgba(250,204,21,0.7)]
                    `}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600/70 to-transparent my-1" />

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/60 to-slate-800/80 border border-slate-500/60">
                    <Volume2 className="h-4 w-4 text-slate-100" />
                  </div>

                  <div className="leading-tight">
                    <p className="text-sm font-medium">
                      {t("soundEffects")}
                    </p>
                    <p className="text-xs mt-0.5 text-slate-400">
                      {soundEffectsEnabled ? "On" : "Off"}
                    </p>
                  </div>
                </div>

                <div dir="ltr">
                  <Switch
                    checked={soundEffectsEnabled}
                    onCheckedChange={handleToggleSfx}
                    className={`
                      data-[state=checked]:bg-yellow-400
                      data-[state=checked]:shadow-[0_0_12px_rgba(250,204,21,0.9)]
                      data-[state=unchecked]:bg-slate-600
                      transition-all duration-200
                      hover:shadow-[0_0_16px_rgba(148,163,184,0.8)]
                    `}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BACK TO MENU BUTTON */}
          <Button
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-semibold shadow-[0_0_22px_rgba(250,204,21,0.7)] hover:shadow-[0_0_30px_rgba(250,204,21,1)] hover:brightness-110 transition-all duration-200"
            onClick={() => {
              navigate("/");
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToMenu")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
