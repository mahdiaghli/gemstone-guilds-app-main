import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLoadingScreen from "@/components/AppLoadingScreen";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AppLoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;

  const needsTutorial = localStorage.getItem("splendor-needs-tutorial") === "true";
  if (needsTutorial) return <Navigate to="/splendor-tutorial?first=1" replace />;

  return <Navigate to="/menu" replace />;
}

