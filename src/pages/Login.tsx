import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import AuthLanguageSwitcher from "@/components/auth/AuthLanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

/* === IMPORT ALL IMAGES HERE === */
import backgroundImg from "@/assets/background.png";
// import backCardImg from "@/assets/backcard1.png"; // اگر نیاز داری در کارت استفاده شود

import gemRed from "@/assets/lock.png";
// import gemBlue from "@/assets/gem-blue.png";
// // import gemGreen from "@/assets/gem-green.png";
import gemEmeraldBig from "@/assets/user.png";
// import gemDiamond from "@/assets/gem-diamond.png";
/* ================================= */

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { dir, t } = useLanguage();
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("splendor-remember-me") === "true",
  );
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(
    () => location?.state?.from?.pathname || "/",
    [location]
  );

  const handleLogin = async () => {
    setError(null);
    const ok = await login(username.trim(), password, rememberMe);
    if (!ok) {
      setError(t("invalidCredentials"));
      return;
    }
    navigate(redirectTo === "/" ? "/menu" : redirectTo, { replace: true });
  };

  return (
    <div
      dir={dir}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImg})` }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* OUTER GEM DECORATIONS */}
      {/* <img
        // src={gemRed}
        alt=""
        className="absolute left-6 top-32 w-20 md:w-24 pointer-events-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      />
      <img
        // src={gemBlue}
        alt=""
        className="absolute right-6 top-40 w-24 md:w-28 pointer-events-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      />
      <img
        // src={gemEmeraldBig}
        alt=""
        className="absolute left-0 bottom-6 w-32 md:w-40 pointer-events-none select-none drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
      />
      <img
        // src={gemDiamond}
        alt=""
        className="absolute right-4 bottom-4 w-28 md:w-32 pointer-events-none select-none drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
      /> */}

      {/* CENTER CARD */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl px-4"
      >
        <div className="mx-auto max-w-xl relative">

          <div
            className="
              relative 
              bg-gradient-to-b from-[#1f2937]/95 via-[#151b24]/95 to-[#0e1218]/95
              px-8 py-10
              rounded-[26px]
              border border-[#cfa85b]/70
              shadow-[0_0_50px_rgba(0,0,0,0.9)]
            "
          >
            <div className="absolute inset-0 border border-yellow-400/40 rounded-[26px] pointer-events-none" />

            {/* TOP BAR */}
            <div className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-4xl font-cinzel font-bold text-[#f5d47a] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                Splendor
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-300/90">
                <AuthLanguageSwitcher />
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-5">
              {/* Username */}
              <div className="flex items-center gap-3 bg-black/30 border border-[#e7c474]/35 rounded-md px-4 py-3">
                <img src={gemEmeraldBig} className="w-6 h-6" alt="" />
                <input
                  type="text"
                  placeholder={t("enterUsername")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent text-gray-100 placeholder:text-gray-300 outline-none text-base"
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-3 bg-black/30 border border-[#e7c474]/35 rounded-md px-4 py-3">
                <img src={gemRed} className="w-6 h-6" alt="" />
                <input
                  type="password"
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-gray-100 placeholder:text-gray-300 outline-none text-base"
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-red-300 text-sm px-1">{error}</p>}

              <label className="flex items-center gap-2 px-1 text-sm text-[#f3d79a]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border border-[#e7c474]/50 bg-transparent"
                />
                <span>Remember me</span>
              </label>

              {/* LOGIN BUTTON */}
              <Button
                onClick={handleLogin}
                disabled={isLoading || !username.trim() || !password}
                className="
                  w-full 
                  bg-gradient-to-b from-[#f4d68b] via-[#e4b44c] to-[#b57d1b]
                  text-[#432b0d]
                  text-lg font-semibold
                  border border-[#f4e0a7]/70
                  rounded-md
                  shadow-[0_0_25px_rgba(0,0,0,0.9)]
                  hover:brightness-110 hover:shadow-[0_0_35px_rgba(248,231,160,0.9)]
                  transition
                "
              >
                {t("loginTitle")}
              </Button>

              {/* Create Account */}
              <button
                onClick={() => navigate("/signup")}
                className="w-full text-center text-[#f3d79a] text-base hover:text-[#fff2c0] transition mt-1"
              >
                {t("createAccount")}
              </button>
            </div>

            {/* FOOTER LINKS */}
            <div className="mt-10 border-t border-[#f5d47a]/40 pt-4">
              <div className="flex justify-center items-center gap-4 text-xs text-gray-300/90">
                <button className="hover:text-white transition">
                  Terms of Service
                </button>
                <span className="text-gray-400">•</span>
                <button className="hover:text-white transition">
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
