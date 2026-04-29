import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import GamesList from "./pages/GamesList";
import Index from "./pages/Index";
import ModeSetup from "./pages/ModeSetup";
import Game from "./pages/Game";
import Tutorial from "./pages/Tutorial";
import OnlineLobby from "./pages/OnlineLobby";
import OnlineMatchmaking from "./pages/OnlineMatchmaking";
import OnlineGame from "./pages/OnlineGame";
import AccountCenter from "./pages/AccountCenter";
import Shop from "./pages/Shop";
import Friends from "./pages/Friends";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import SoloChallenge from "./pages/SoloChallenge";
import AboutUs from "./pages/AboutUs";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Landing />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/game" element={<Game />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
