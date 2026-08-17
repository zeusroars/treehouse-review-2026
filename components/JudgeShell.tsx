"use client";

import SiteHeader from "@/components/SiteHeader";
import JudgeNavBar from "@/components/judge/JudgeNavBar";

interface JudgeShellProps {
  children: React.ReactNode;
  /** When true, child fills remaining viewport below header */
  fill?: boolean;
  /** Show phase tabs and sign-out bar for authenticated judge workspace */
  showPhaseNav?: boolean;
}

export default function JudgeShell({
  children,
  fill = false,
  showPhaseNav = false,
}: JudgeShellProps) {
  return (
    <div
      className={`flex flex-col bg-wood-50 ${fill ? "h-screen overflow-hidden" : "min-h-screen"}`}
    >
      <SiteHeader variant="judge" />
      {showPhaseNav ? <JudgeNavBar /> : null}
      <div className={fill ? "flex min-h-0 flex-1 flex-col" : "flex-1"}>
        {children}
      </div>
    </div>
  );
}
