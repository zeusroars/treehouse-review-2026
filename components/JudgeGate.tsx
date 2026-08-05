"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  saveJudgeSession,
  validateJudge,
  type JudgeSession,
} from "@/lib/review-client";

interface JudgeGateProps {
  onAuthenticated: (session: JudgeSession) => void;
}

export default function JudgeGate({ onAuthenticated }: JudgeGateProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await validateJudge(code.trim());
      if (!result.ok || !result.judgeId) {
        setError(result.error ?? t("judge.invalidCode"));
        return;
      }
      const session: JudgeSession = {
        judgeId: result.judgeId,
        judgeName: result.judgeName ?? result.judgeId,
        role: result.role ?? "judge",
      };
      saveJudgeSession(session);
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("judge.connectError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-200/80">
        <div className="mb-6 flex items-center gap-2 text-sage-600">
          <Leaf className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-[0.15em]">
            {t("judge.gateLabel")}
          </span>
        </div>
        <h1 className="text-xl font-light text-slate-800">
          {t("judge.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {t("judge.gateHint")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="judge-code"
              className="mb-1.5 block text-xs font-medium text-slate-500"
            >
              {t("judge.codeLabel")}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                id="judge-code"
                type="password"
                autoComplete="current-password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 transition-all duration-200 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200/60"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full rounded-2xl bg-sage-600 py-3.5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-sage-500 disabled:opacity-50"
          >
            {loading ? t("judge.verifying") : t("judge.enter")}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-sage-600 underline-offset-2 hover:underline"
          >
            {t("judge.backToGallery")}
          </Link>
        </p>
      </div>
    </div>
  );
}
