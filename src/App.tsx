import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { App as CapApp } from "@capacitor/app";
import { isNativeApp } from "@/lib/nativeApp";
import AppLoadingScreen from "@/components/AppLoadingScreen";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const GamesList = lazy(() => import("./pages/GamesList"));
const Index = lazy(() => import("./pages/Index"));
const ModeSetup = lazy(() => import("./pages/ModeSetup"));
const Game = lazy(() => import("./pages/Game"));
const SplendorStepByStepTutorial = lazy(() => import("./pages/SplendorStepByStepTutorial"));
const DeadMansDrawTutorial = lazy(() => import("./pages/DeadMansDrawTutorial"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const OnlineLobby = lazy(() => import("./pages/OnlineLobby"));
const OnlineMatchmaking = lazy(() => import("./pages/OnlineMatchmaking"));
const OnlineGame = lazy(() => import("./pages/OnlineGame"));
const AccountCenter = lazy(() => import("./pages/AccountCenter"));
const Shop = lazy(() => import("./pages/Shop"));
const Friends = lazy(() => import("./pages/Friends"));
const Groups = lazy(() => import("./pages/Groups"));
const Events = lazy(() => import("./pages/Events"));
const SoloChallenge = lazy(() => import("./pages/SoloChallenge"));
const AboutUs = lazy(() => import("./pages/AboutUs"));

const queryClient = new QueryClient();

function GlobalMusicBoot() {
  useBackgroundMusic();
  return null;
}

function AppBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeApp()) return;

    const handleBack = () => {
      const path = location.pathname;
      if (path.startsWith("/game") || path.startsWith("/online-game")) {
        window.dispatchEvent(new CustomEvent("gemstone-app-back-request"));
        return;
      }

      if (window.history.length > 1 && path !== "/" && path !== "/menu") {
        navigate(-1);
        return;
      }

      if (path !== "/menu") {
        navigate("/menu");
      }
    };

    const subPromise = CapApp.addListener("backButton", handleBack);
    return () => {
      subPromise.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AppLoadingScreen />;
  if (user) return <Navigate to="/menu" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <MotionConfig reducedMotion={isNativeApp() ? "always" : "user"}>
          <GlobalMusicBoot />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppBackHandler />
            <Suspense fallback={<AppLoadingScreen />}>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfAuthed>
                  <SignUp />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/menu"
              element={
                <RequireAuth>
                  <GamesList />
                </RequireAuth>
              }
            />
            <Route
              path="/menu/:gameId"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountCenter />
                </RequireAuth>
              }
            />
            <Route
              path="/shop"
              element={
                <RequireAuth>
                  <Shop />
                </RequireAuth>
              }
            />
            <Route
              path="/friends"
              element={
                <RequireAuth>
                  <Friends />
                </RequireAuth>
              }
            />
            <Route
              path="/groups"
              element={
                <RequireAuth>
                  <Groups />
                </RequireAuth>
              }
            />
            <Route
              path="/groups/create"
              element={
                <RequireAuth>
                  <Groups />
                </RequireAuth>
              }
            />
            <Route
              path="/groups/find"
              element={
                <RequireAuth>
                  <Groups />
                </RequireAuth>
              }
            />
            <Route
              path="/groups/rank"
              element={
                <RequireAuth>
                  <Groups />
                </RequireAuth>
              }
            />
            <Route
              path="/events"
              element={
                <RequireAuth>
                  <Events />
                </RequireAuth>
              }
            />
            <Route
              path="/events/solo/:challengeId"
              element={
                <RequireAuth>
                  <SoloChallenge />
                </RequireAuth>
              }
            />
            <Route
              path="/about"
              element={
                <RequireAuth>
                  <AboutUs />
                </RequireAuth>
              }
            />
            <Route
              path="/mode-setup"
              element={
                <RequireAuth>
                  <ModeSetup />
                </RequireAuth>
              }
            />
            <Route
              path="/game"
              element={
                <RequireAuth>
                  <Game />
                </RequireAuth>
              }
            />
            <Route path="/splendor-tutorial" element={<SplendorStepByStepTutorial />} />
            <Route path="/tutorial-deadmansdraw" element={<DeadMansDrawTutorial />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route
              path="/online-lobby"
              element={
                <RequireAuth>
                  <OnlineLobby />
                </RequireAuth>
              }
            />
            <Route
              path="/online-matchmaking"
              element={
                <RequireAuth>
                  <OnlineMatchmaking />
                </RequireAuth>
              }
            />
            <Route
              path="/online-game/:roomId"
              element={
                <RequireAuth>
                  <OnlineGame />
                </RequireAuth>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </MotionConfig>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
