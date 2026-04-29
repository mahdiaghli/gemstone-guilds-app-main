import { type ReactNode } from "react";

import PageTopBar from "@/components/game/PageTopBar";
import AppBottomNav from "@/components/game/AppBottomNav";
import { useLanguage } from "@/hooks/useLanguage";
import heroImage from "@/assets/hero-gems.jpg";

interface AppPageShellProps {
  currentPath: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  backgroundImage?: string;
  children: ReactNode;
}

export default function AppPageShell({
  currentPath,
  title,
  subtitle,
  showHeader = true,
  backgroundImage = heroImage,
  children,
}: AppPageShellProps) {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
      <PageTopBar />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-24 md:px-6">
        {showHeader && (title || subtitle) && (
          <div className="mb-6 rounded-3xl border border-primary/20 bg-card/60 p-5 shadow-xl backdrop-blur">
            {title && <h1 className="font-cinzel text-3xl text-primary">{title}</h1>}
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
      <AppBottomNav currentPath={currentPath} />
    </div>
  );
}
