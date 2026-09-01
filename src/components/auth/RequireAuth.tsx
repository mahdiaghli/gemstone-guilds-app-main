import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { lang } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-amber-100">
        {lang === "fa" ? "در حال بارگذاری…" : "Loading…"}
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
