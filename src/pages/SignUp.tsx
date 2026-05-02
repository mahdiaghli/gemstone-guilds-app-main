import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLanguageSwitcher from "@/components/auth/AuthLanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

import splendorBg from "@/assets/background.png"; 
import gameLogo from "@/assets/logo.png";    

import avatar1 from "@/assets/merchant.png";
import avatar2 from "@/assets/merchant2.png";
import avatar3 from "@/assets/merchant girl.png";


import emailImage from "@/assets/email.png";
import userImage from "@/assets/user.png";
import lockImage from "@/assets/lock.png";

export default function SignUp() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { dir, t } = useLanguage();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("splendor-remember-me") === "true",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);

    if (password !== confirm) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    const ok = await register(username.trim(), email.trim(), password, rememberMe);
    if (!ok) {
      setError(t("usernameExists"));
      return;
    }

    navigate("/tutorial?first=1", { replace: true });
  };

  return (
    <div dir={dir} className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${splendorBg})` }}
      />

      <div className="absolute inset-0 bg-black/15" />

      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl px-4"
      >
        <div className="relative mx-auto bg-black/85 rounded-[26px] shadow-[0_0_55px_rgba(0,0,0,0.95)] border border-[#f0cc73] px-10 py-8 sm:px-12 sm:py-10 text-center backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-[10px] rounded-[22px] border border-[#e1b64f]/80" />

          <div className="relative z-10 mb-4 flex justify-end">
            <AuthLanguageSwitcher />
          </div>

          <div className="relative z-10 mb-6 sm:mb-8 flex flex-col items-center">
            <img
              src={gameLogo}
              alt="Game Logo"
              className="
                h-16 sm:h-20
                object-contain
                drop-shadow-[0_0_18px_rgba(255,230,150,0.9)]
                brightness-110
                contrast-125
              "
            />

            <h1 className="mt-4 text-3xl sm:text-4xl font-cinzel font-bold text-[#fdf2c5] drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]">
              {t("signupTitle")}
            </h1>

            <p className="mt-1 text-sm sm:text-base text-[#f6e3a0] italic">
              {t("signupSubtitle")}
            </p>
          </div>

          <div className={`relative z-10 mx-auto max-w-md space-y-3 text-left sm:space-y-3.5 ${dir === "rtl" ? "text-right" : "text-left"}`}>
            <Field
              label={t("chooseUsername")}
              type="text"
              icon="user"
              value={username}
              onChange={setUsername}
              dir={dir}
            />

            <Field
              label={t("enterEmail")}
              type="email"
              icon="mail"
              value={email}
              onChange={setEmail}
              dir={dir}
            />

            <Field
              label={t("createPassword")}
              type="password"
              icon="lock"
              value={password}
              onChange={setPassword}
              dir={dir}
            />

            <Field
              label={t("passwordLabel")}
              type="password"
              icon="lock"
              value={confirm}
              onChange={setConfirm}
              dir={dir}
            />

            {error && (
              <div className="mt-1 text-xs text-red-200 bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2 text-center">
                {error}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 text-sm text-[#f7ebc3]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border border-[#f6d78a]/60 bg-transparent"
              />
              <span>Remember me</span>
            </label>

            <div className="pt-3 pb-4 flex items-center justify-center gap-4">
              <span className="inline-block h-[1px] w-16 bg-[#c5a55a]/60" />
              <div className="flex gap-3">
                <Avatar src={avatar1} />
                <Avatar src={avatar2} />
                <Avatar src={avatar3} />
              </div>
              <span className="inline-block h-[1px] w-16 bg-[#c5a55a]/60" />
            </div>

            <button
              onClick={handleSignUp}
              disabled={
                isLoading ||
                !username.trim() ||
                !password ||
                !confirm
              }
              className="w-full mt-1 h-12 rounded-[10px] bg-gradient-to-b from-[#f6d78a] via-[#f0c86e] to-[#c98b2b] text-lg font-semibold text-[#4b2c06] shadow-[0_10px_18px_rgba(0,0,0,0.7)] border border-[#f8e3a5] hover:brightness-110 hover:shadow-[0_12px_26px_rgba(0,0,0,0.9)] active:translate-y-[1px] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t("signupTitle")}
            </button>

            <p className="mt-3 text-sm text-[#f7ebc3] text-center italic">
              {t("alreadyHaveAccountPrompt")}{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="underline text-[#fef5cf] hover:text-white"
              >
                {t("loginTitle")}
              </button>
            </p>

            <p className="mt-2 text-[11px] text-[#f5e1a1] text-center">
              By signing up you accept the{" "}
              <button
                type="button"
                className="text-[#fddf7b] underline hover:text-[#ffe9a8]"
              >
                Terms of Service
              </button>
            </p>

            <div className="mt-4 flex">
              <button className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-white text-sm font-medium text-[#444] shadow-md hover:bg-[#f7f7f7]">
                <span className="text-lg">G</span>
                <span>Sign up with Google</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ——————————————————————
   FIELD COMPONENT (با تصاویر به‌جای ایموجی)
—————————————————————— */

type FieldProps = {
  label: string;
  type: string;
  icon: "user" | "mail" | "lock";
  value: string;
  onChange: (v: string) => void;
  dir: "rtl" | "ltr";
};

function Field({ label, type, icon, value, onChange, dir }: FieldProps) {
  const iconSrc =
    icon === "user"
      ? userImage
      : icon === "mail"
      ? emailImage
      : lockImage;

  return (
    <label className="block text-xs text-[#f6e8bc]">
      <div className="flex items-center h-11 rounded-md border border-[#3a2f12] bg-black/60 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* icon */}
        <div className="flex items-center justify-center px-3">
          <img
            src={iconSrc}
            alt=""
            className="w-8 h-8 object-contain opacity-95"
          />
        </div>

        <input
          type={type}
          dir={dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className={`flex-1 bg-transparent border-none px-2 text-sm text-[#fdf2c5] outline-none placeholder:text-[#f5e0aa]/70 ${dir === "rtl" ? "text-right" : "text-left"}`}
        />
      </div>
    </label>
  );
}


/* ——————————————————————
   AVATAR LIST ICONS
—————————————————————— */

function Avatar({ src }: { src: string }) {
  return (
    <div className="w-12 h-12 rounded-full border-[3px] border-[#f6d78a] bg-[#8b5a2a] overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.8)]">
      <img
        src={src}
        alt="avatar"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
