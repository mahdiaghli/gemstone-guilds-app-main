import { Home, ShoppingBag, Users, ShieldPlus, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const NAV_ITEMS = [
  { key: "shopPage", icon: ShoppingBag, path: "/shop" },
  { key: "friendsPage", icon: Users, path: "/friends" },
  { key: "mainPage", icon: Home, path: "/menu" },
  { key: "groupsPage", icon: ShieldPlus, path: "/groups" },
  { key: "eventsPage", icon: Trophy, path: "/events" },
] as const;

interface AppBottomNavProps {
  currentPath: string;
}

export default function AppBottomNav({ currentPath }: AppBottomNavProps) {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4" dir={dir}>
      {/* کانتینر اصلی نوار */}
      <div
        className={cn(
          "mx-auto flex w-full max-w-md items-center justify-between",
          "rounded-[999px] border border-amber-400/25",
          "bg-slate-950/95 shadow-[0_0_30px_rgba(15,23,42,0.9)]",
          "px-3 py-2.5 backdrop-blur-md"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.94 }}
              whileHover={isActive ? { y: -1 } : { y: -2 }}
              onClick={() => navigate(item.path)}
              className={cn(
                "group flex min-w-0 flex-1 flex-col items-center justify-center gap-1",
                "rounded-full px-2 py-1.5 text-[11px] font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-0",
                isActive
                  ? [
                      "bg-amber-400 text-slate-950",
                      "shadow-[0_0_18px_rgba(251,191,36,0.8)]",
                      "-translate-y-[2px]",
                    ]
                  : [
                      "text-slate-300/70",
                      "hover:text-slate-100",
                    ]
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-slate-950" : "text-slate-300/80 group-hover:text-slate-100"
                )}
              />
              <span
                className={cn(
                  "line-clamp-1 text-center leading-none",
                  isActive ? "text-[11px]" : "text-[11px]"
                )}
              >
                {t(item.key)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
