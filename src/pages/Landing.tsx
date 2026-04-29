import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  const needsTutorial = localStorage.getItem("splendor-needs-tutorial") === "true";
  if (needsTutorial) return <Navigate to="/tutorial?first=1" replace />;

  return <Navigate to="/menu" replace />;
}

