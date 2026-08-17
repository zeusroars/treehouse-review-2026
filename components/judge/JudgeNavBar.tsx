"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  clearJudgeSession,
  isAdminSession,
  loadJudgeSession,
  type JudgeSession,
} from "@/lib/review-client";

export default function JudgeNavBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [session, setSession] = useState<JudgeSession | null>(null);

  useEffect(() => {
    setSession(loadJudgeSession());
  }, []);

  const phase1Active =
    pathname === "/judge" || pathname === "/judge/dashboard";
  const phase2Active = pathname.startsWith("/judge/day4-lounge");
  const phase3Active = pathname.startsWith("/judge/day5-board");
  const isAdmin = session ? isAdminSession(session) : false;

  const handleSignOut = () => {
    clearJudgeSession();
    window.location.href = "/judge";
  };

  return (
    <nav className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link
            href="/judge"
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              phase1Active
                ? "border-sage-600 text-sage-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
            }`}
          >
            {t("judge.navPhase1")}
          </Link>
          <Link
            href="/judge/day4-lounge"
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              phase2Active
                ? "border-sage-600 text-sage-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
            }`}
          >
            {t("judge.navPhase2")}
          </Link>
          {isAdmin ? (
            <Link
              href="/judge/day5-board"
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                phase3Active
                  ? "border-sage-600 text-sage-700"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
              }`}
            >
              {t("judge.navPhase3")}
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("scoring.signOut")}
        </button>
      </div>
    </nav>
  );
}
