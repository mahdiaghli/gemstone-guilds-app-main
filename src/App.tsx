import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/game/LanguageToggle";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Tutorial from "./pages/Tutorial";
import OnlineLobby from "./pages/OnlineLobby";
import OnlineMatchmaking from "./pages/OnlineMatchmaking";
import OnlineGame from "./pages/OnlineGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageToggle />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/game" element={<Game />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/online-lobby" element={<OnlineLobby />} />
            <Route path="/online-matchmaking" element={<OnlineMatchmaking />} />
            <Route path="/online-game/:roomId" element={<OnlineGame />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
