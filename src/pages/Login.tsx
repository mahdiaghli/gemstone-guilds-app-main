import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import backgroundImg from "@/assets/background.png";
import phoneIcon from "@/assets/user.webp";
import codeIcon from "@/assets/lock.webp";

const otpDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, 6);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dir, lang, t } = useLanguage();
  const { login, requestOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("splendor-remember-me") === "true");
  const redirectTo = useMemo(() => (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/", [location.state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
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
        setError(result.reason === "invalid_input" ? (lang === "fa" ? "شماره موبایل معتبر نیست." : "Enter a valid Iranian mobile number.") : (lang === "fa" ? "ارسال کد انجام نشد. اتصال سرور را بررسی کنید." : "Could not send the code. Check the server connection."));
        return;
      }
      setCodeSent(true);
      setCooldown(result.retryAfterSeconds);
      setInfo(result.devCode ? `${lang === "fa" ? "کد توسعه" : "Development code"}: ${result.devCode}` : (lang === "fa" ? "کد تأیید برای شما پیامک شد." : "A verification code was sent to you."));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login(phone, code, rememberMe);
      if (!result.ok) {
        if (result.reason === "account_not_found") {
          setError(lang === "fa" ? "حسابی با این شماره پیدا نشد؛ ابتدا ثبت‌نام کنید." : "No account was found for this number. Please sign up first.");
        } else {
          setError(result.reason === "server_unavailable" ? t("serverNotAvailable") : (lang === "fa" ? "شماره موبایل یا کد تأیید نادرست است." : "The mobile number or verification code is invalid."));
        }
        return;
      }
      navigate(redirectTo === "/" ? "/menu" : redirectTo, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir={dir} className="relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImg})` }} />
      <div className="absolute inset-0 bg-black/40" />
      <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-xl px-3 py-4 sm:px-4">
        <div className="relative mx-auto rounded-[26px] border border-[#cfa85b]/70 bg-gradient-to-b from-[#1f2937]/95 via-[#151b24]/95 to-[#0e1218]/95 px-5 py-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-yellow-400/40" />
          <div className="relative mb-7 flex items-center justify-between gap-4">
            <h1 className="font-cinzel text-4xl font-bold text-[#f5d47a] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">Swift</h1>
          </div>
          <p className="relative mb-5 text-sm italic text-[#f3d79a]">{t("loginSubtitle")}</p>
          <form className="relative space-y-4" onSubmit={handleLogin}>
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#e7c474]/35 bg-black/30 px-4">
              <img src={phoneIcon} className="h-7 w-7" alt="" />
              <input type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-label={lang === "fa" ? "شماره موبایل" : "Mobile number"} placeholder={lang === "fa" ? "شماره موبایل (09xxxxxxxxx)" : "Mobile number (09xxxxxxxxx)"} value={phone} onChange={(event) => { setPhone(event.target.value); setCodeSent(false); setCode(""); }} className="min-w-0 flex-1 bg-transparent text-left text-base text-gray-100 outline-none placeholder:text-gray-300" />
            </label>
            <div className="flex gap-2">
              <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-md border border-[#e7c474]/35 bg-black/30 px-4">
                <img src={codeIcon} className="h-7 w-7" alt="" />
                <input type="text" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label={lang === "fa" ? "کد تأیید" : "Verification code"} placeholder={lang === "fa" ? "کد تأیید" : "Verification code"} value={code} onChange={(event) => setCode(otpDigits(event.target.value))} className="min-w-0 flex-1 bg-transparent text-left text-base text-gray-100 outline-none placeholder:text-gray-300" />
              </label>
              <button type="button" onClick={handleSendCode} disabled={isSendingCode || cooldown > 0 || !phone.trim()} className="min-h-12 min-w-[112px] rounded-md border border-[#f5d47a]/60 px-3 text-xs font-semibold text-[#f5d47a] transition hover:bg-[#f5d47a]/10 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
                {isSendingCode ? (lang === "fa" ? "در حال ارسال..." : "Sending...") : cooldown > 0 ? `${lang === "fa" ? "ارسال مجدد" : "Resend"} (${cooldown})` : lang === "fa" ? "دریافت کد" : "Send code"}
              </button>
            </div>
            {info && <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">{info}</p>}
            {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-900/30 px-3 py-2 text-sm text-red-300">{error}</p>}
            <label className="flex min-h-11 items-center gap-2 px-1 text-sm text-[#f3d79a]">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-5 w-5 rounded border border-[#e7c474]/50 bg-transparent" />
              <span>{lang === "fa" ? "مرا به خاطر بسپار" : "Remember me"}</span>
            </label>
            <Button type="submit" disabled={isSubmitting || !codeSent || code.length !== 6} className="min-h-12 w-full rounded-md border border-[#f4e0a7]/70 bg-gradient-to-b from-[#f4d68b] via-[#e4b44c] to-[#b57d1b] text-lg font-semibold text-[#432b0d] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:brightness-110 disabled:opacity-50">
              {isSubmitting ? (lang === "fa" ? "کمی صبر کنید..." : "Please wait...") : (lang === "fa" ? "ورود با کد تأیید" : "Sign in with code")}
            </Button>
            <button type="button" onClick={() => navigate("/signup")} className="min-h-11 w-full text-center text-base text-[#f3d79a] transition hover:text-[#fff2c0]">{t("createAccount")}</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
