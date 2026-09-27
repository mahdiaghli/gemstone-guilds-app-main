import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

import splendorBg from "@/assets/background.png";
import gameLogo from "@/assets/logo.webp";
import avatar1 from "@/assets/merchant.webp";
import avatar2 from "@/assets/merchant2.webp";
import avatar3 from "@/assets/merchant girl.webp";
import phoneImage from "@/assets/email.webp";
import userImage from "@/assets/user.webp";
import lockImage from "@/assets/lock.webp";

const otpDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 6);

export default function SignUp() {
  const navigate = useNavigate();
  const { register, requestOtp } = useAuth();
  const { dir, lang, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("splendor-remember-me") === "true",
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    if (cooldown > 0 || isSendingCode) return;
    setError(null);
    setInfo(null);
    setIsSendingCode(true);
    try {
      const result = await requestOtp(phone);
      if (!result.ok) {
        setError(
          result.reason === "invalid_input"
            ? lang === "fa" ? "شماره موبایل معتبر نیست." : "Enter a valid Iranian mobile number."
            : lang === "fa" ? "ارسال کد انجام نشد. اتصال سرور را بررسی کنید." : "Could not send the code. Check the server connection.",
        );
        return;
      }
      setCodeSent(true);
      setCooldown(result.retryAfterSeconds);
      setInfo(
        result.devCode
          ? `${lang === "fa" ? "کد توسعه" : "Development code"}: ${result.devCode}`
          : lang === "fa" ? "کد تأیید برای شما پیامک شد." : "A verification code was sent to you.",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (username.trim().length > 15) {
      setError(t("usernameTooLong"));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await register(username.trim(), phone, code, rememberMe);
      if (!result.ok) {
        const messages = {
          username_exists: lang === "fa" ? "این نام بازیکن قبلاً انتخاب شده است." : "This player name is already taken.",
          phone_exists: lang === "fa" ? "با این شماره قبلاً حساب ساخته شده است؛ وارد شوید." : "An account already exists for this number. Please sign in.",
          account_not_found: lang === "fa" ? "حساب کاربری پیدا نشد." : "Account not found.",
          invalid_code: lang === "fa" ? "کد تأیید نادرست یا منقضی شده است." : "The verification code is invalid or expired.",
          invalid_input: lang === "fa" ? "نام، شماره موبایل و کد را بررسی کنید." : "Check the name, mobile number, and code.",
          invalid_credentials: lang === "fa" ? "اطلاعات ورود معتبر نیست." : "The sign-in details are invalid.",
          server_unavailable: t("serverNotAvailable"),
        };
        setError(messages[result.reason]);
        return;
      }
      navigate("/tutorial?first=1", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir={dir} className="relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${splendorBg})` }} />
      <div className="absolute inset-0 bg-black/20" />
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl px-3 py-4 sm:px-4"
      >
        <div className="relative mx-auto rounded-[26px] border border-[#f0cc73] bg-black/85 px-5 py-5 text-center shadow-[0_0_55px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:px-12 sm:py-8">
          <div className="pointer-events-none absolute inset-[10px] rounded-[22px] border border-[#e1b64f]/80" />
          <div className="relative z-10 mb-4 flex flex-col items-center">
            <img src={gameLogo} alt="Swift" className="h-14 rounded-2xl object-contain brightness-110 contrast-125 drop-shadow-[0_0_18px_rgba(255,230,150,0.9)] sm:h-20" />
            <h1 className="mt-3 font-cinzel text-3xl font-bold text-[#fdf2c5] drop-shadow-[0_0_10px_rgba(0,0,0,0.9)] sm:text-4xl">Swift</h1>
            <p className="mt-1 text-sm italic text-[#f6e3a0] sm:text-base">{t("signupSubtitle")}</p>
          </div>

          <form onSubmit={handleSignUp} className={`relative z-10 mx-auto max-w-md space-y-3 ${dir === "rtl" ? "text-right" : "text-left"}`}>
            <Field label={t("chooseUsername")} type="text" icon="user" value={username} onChange={setUsername} dir={dir} autoComplete="username" maxLength={15} />
            <Field label={lang === "fa" ? "شماره موبایل" : "Mobile number"} type="tel" icon="phone" value={phone} onChange={(value) => { setPhone(value); setCodeSent(false); setCode(""); }} dir={dir} autoComplete="tel" inputMode="tel" maxLength={14} />
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <Field label={lang === "fa" ? "کد تأیید ۶ رقمی" : "6-digit code"} type="text" icon="lock" value={code} onChange={(value) => setCode(otpDigits(value))} dir="ltr" autoComplete="one-time-code" inputMode="numeric" maxLength={6} />
              </div>
              <button type="button" onClick={handleSendCode} disabled={isSendingCode || cooldown > 0 || !phone.trim()} className="min-h-11 min-w-[112px] rounded-md border border-[#f6d78a]/70 bg-[#f6d78a]/10 px-3 text-xs font-semibold text-[#f6d78a] transition hover:bg-[#f6d78a]/20 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
                {isSendingCode ? (lang === "fa" ? "در حال ارسال..." : "Sending...") : cooldown > 0 ? `${lang === "fa" ? "ارسال مجدد" : "Resend"} (${cooldown})` : lang === "fa" ? "دریافت کد" : "Send code"}
              </button>
            </div>
            {info && <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-center text-xs text-emerald-200">{info}</p>}
            {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-900/30 px-3 py-2 text-center text-xs text-red-200">{error}</p>}
            <label className="flex min-h-11 items-center justify-center gap-2 text-sm text-[#f7ebc3]">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-5 w-5 rounded border border-[#f6d78a]/60 bg-transparent" />
              <span>{lang === "fa" ? "مرا به خاطر بسپار" : "Remember me"}</span>
            </label>
            <div className="flex items-center justify-center gap-3 py-1">
              <span className="h-px w-12 bg-[#c5a55a]/60" />
              <Avatar src={avatar1} /><Avatar src={avatar2} /><Avatar src={avatar3} />
              <span className="h-px w-12 bg-[#c5a55a]/60" />
            </div>
            <button type="submit" disabled={isSubmitting || !codeSent || !username.trim() || code.length !== 6} className="mt-1 h-12 w-full rounded-[10px] border border-[#f8e3a5] bg-gradient-to-b from-[#f6d78a] via-[#f0c86e] to-[#c98b2b] text-lg font-semibold text-[#4b2c06] shadow-[0_10px_18px_rgba(0,0,0,0.7)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? (lang === "fa" ? "کمی صبر کنید..." : "Please wait...") : t("signupTitle")}
            </button>
            <p className="text-center text-sm italic text-[#f7ebc3]">
              {t("alreadyHaveAccountPrompt")} {" "}
              <button type="button" onClick={() => navigate("/login")} className="min-h-11 px-2 text-[#fef5cf] underline hover:text-white">{t("loginTitle")}</button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

type FieldProps = {
  label: string;
  type: string;
  icon: "user" | "phone" | "lock";
  value: string;
  onChange: (value: string) => void;
  dir: "rtl" | "ltr";
  autoComplete?: string;
  inputMode?: "text" | "tel" | "numeric";
  maxLength?: number;
};

function Field({ label, type, icon, value, onChange, dir, autoComplete, inputMode, maxLength }: FieldProps) {
  const iconSrc = icon === "user" ? userImage : icon === "phone" ? phoneImage : lockImage;
  return (
    <label className="block text-xs text-[#f6e8bc]">
      <span className="flex min-h-11 items-center overflow-hidden rounded-md border border-[#3a2f12] bg-black/60 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)]">
        <span className="flex items-center justify-center px-3"><img src={iconSrc} alt="" className="h-8 w-8 object-contain opacity-95" /></span>
        <input type={type} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} autoComplete={autoComplete} inputMode={inputMode} placeholder={label} aria-label={label} className={`min-w-0 flex-1 border-none bg-transparent px-2 text-sm text-[#fdf2c5] outline-none placeholder:text-[#f5e0aa]/70 ${dir === "rtl" ? "text-right" : "text-left"}`} />
      </span>
    </label>
  );
}

function Avatar({ src }: { src: string }) {
  return <div className="h-11 w-11 overflow-hidden rounded-full border-[3px] border-[#f6d78a] bg-[#8b5a2a] shadow-[0_0_10px_rgba(0,0,0,0.8)]"><img src={src} alt="" className="h-full w-full object-cover" /></div>;
}
