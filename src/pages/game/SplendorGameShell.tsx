import type { ReactNode } from "react";

type SplendorGameShellProps = {
  dir: "ltr" | "rtl";
  backgroundImage: string;
  children: ReactNode;
};

export default function SplendorGameShell({ dir, backgroundImage, children }: SplendorGameShellProps) {
  return (
    <div dir={dir} className="relative flex min-h-screen flex-col overflow-hidden p-2 md:p-4">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,22,0.18),rgba(10,14,22,0.42)),radial-gradient(circle_at_top,rgba(255,248,220,0.12),transparent_36%)]" />
      <div className="relative z-10 flex min-h-screen flex-col rounded-[28px] bg-slate-950/18 px-2 py-2 backdrop-blur-[1px] md:px-3 md:py-3">
        {children}
      </div>
    </div>
  );
}
