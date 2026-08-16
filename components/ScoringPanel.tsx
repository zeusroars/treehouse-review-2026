"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Send, Leaf, Shield } from "lucide-react";
import Link from "next/link";
import ScoreSlider from "./ScoreSlider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedDesignStatement } from "@/hooks/useLocalizedDesignStatement";
import {
  defaultComments,
  defaultScores,
  getCriteriaForCategory,
  weightedTotal,
} from "@/lib/criteria";
import { submitScore } from "@/lib/review-client";
import type { EntryCategory } from "@/types/review";

interface ScoringPanelProps {
  judgeId: string;
  judgeName: string;
  isAdmin?: boolean;
  currentWork: number;
  totalWorks: number;
  entryId: string;
  category: EntryCategory;
  designConcept: string;
  workTitle?: string;
  workConcept?: string;
  workConceptExtra?: string;
  scoreCount?: number;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onGoPrev?: () => void;
  onGoNext?: () => void;
  onScoreSubmitted: (nextEntryId?: string | null) => void;
  onSignOut: () => void;
}

export default function ScoringPanel({
  judgeId,
  judgeName,
  isAdmin = false,
  currentWork,
  totalWorks,
  entryId,
  category,
  designConcept,
  workTitle,
  workConcept,
  workConceptExtra,
  scoreCount,
  canGoPrev = false,
  canGoNext = false,
  onGoPrev,
  onGoNext,
  onScoreSubmitted,
  onSignOut,
}: ScoringPanelProps) {
  const { t } = useLanguage();
  const criteria = useMemo(() => getCriteriaForCategory(category), [category]);

  const {
    formatted: localizedDesignStatement,
    translating: translatingStatement,
    translateError,
  } = useLocalizedDesignStatement({
    designConcept,
    workTitle,
    workConcept,
    workConceptExtra,
    entryId,
  });

  const [scores, setScores] = useState<Record<string, number>>(() =>
    defaultScores(criteria)
  );
  const [conceptOpen, setConceptOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScores(defaultScores(criteria));
    setSubmitted(false);
    setError(null);
  }, [entryId, criteria]);

  const weighted = weightedTotal(criteria, scores);
  const progressPercent =
    totalWorks > 0 ? (currentWork / totalWorks) * 100 : 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitScore({
        judgeId,
        entryId,
        category,
        scores,
        comments: defaultComments(criteria),
      });
      if (!result.ok) {
        setError(result.error ?? t("scoring.submitFailed"));
        return;
      }
      setSubmitted(true);
      onScoreSubmitted(result.nextEntryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scoring.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex h-full min-h-[50vh] w-full shrink-0 flex-col glass-panel lg:min-h-0 lg:w-[min(100%,20rem)] xl:w-[22rem]">
      <header className="border-b border-slate-200/60 px-4 py-4 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sage-600">
            {isAdmin ? (
              <Shield className="h-4 w-4 text-amber-600" />
            ) : (
              <Leaf className="h-4 w-4" />
            )}
            <span className="text-xs font-medium uppercase tracking-[0.15em]">
              {isAdmin ? t("scoring.adminOverview") : t("scoring.reviewProgress")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/judge/dashboard"
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {t("adminDashboard.shortLink")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("scoring.signOut")}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-light text-slate-800">
            {t("scoring.work")}{" "}
            <span className="font-semibold text-sage-700">{currentWork}</span>
            <span className="text-slate-300"> / </span>
            {totalWorks}
          </h2>
          <span className="font-mono text-[10px] text-slate-400">{entryId}</span>
        </div>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
          {isAdmin ? t("scoring.adminPrefix") : t("scoring.judgePrefix")}
          {judgeName}
          {isAdmin && scoreCount !== undefined && (
            <span className="ml-2 text-amber-700">
              {t("scoring.scoreCount", { count: scoreCount })}
            </span>
          )}
        </p>

        {isAdmin && (
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={onGoPrev}
              disabled={!canGoPrev}
              className="flex flex-1 items-center justify-center gap-0.5 rounded-lg border border-slate-200 py-1.5 text-[10px] text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("scoring.prevEntry")}
            </button>
            <button
              type="button"
              onClick={onGoNext}
              disabled={!canGoNext}
              className="flex flex-1 items-center justify-center gap-0.5 rounded-lg border border-slate-200 py-1.5 text-[10px] text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              {t("scoring.nextEntry")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          {t("scoring.estimatedWeighted")}{" "}
          <span className="font-medium text-sage-600">{weighted.toFixed(1)}</span>
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-5">
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white/70">
          <button
            type="button"
            onClick={() => setConceptOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50/80"
          >
            {t("scoring.designConcept")}
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${conceptOpen ? "rotate-180" : ""}`}
            />
          </button>
          {conceptOpen && (
            <div className="max-h-32 overflow-y-auto border-t border-slate-100 px-3 py-2.5 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
              {translatingStatement ? (
                <p className="text-slate-400">{t("scoring.translatingStatement")}</p>
              ) : localizedDesignStatement.trim() ? (
                localizedDesignStatement
              ) : (
                t("scoring.noDesignConcept")
              )}
              {translateError ? (
                <p className="mt-2 text-[10px] text-amber-600">{translateError}</p>
              ) : null}
            </div>
          )}
        </div>

        <p className="mb-3 text-[10px] leading-relaxed text-slate-400">
          {isAdmin ? t("scoring.adminHint") : t("scoring.judgeHint")}
        </p>

        <div className="space-y-3">
          {criteria.map(({ key, label, weight }) => (
            <ScoreSlider
              key={key}
              compact
              label={t(`criteria.${key}`) || label}
              weight={weight}
              value={scores[key] ?? 0}
              onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <footer className="border-t border-slate-200/60 px-4 py-4 lg:px-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || submitted}
          className="group relative w-full overflow-hidden rounded-xl py-3 text-xs font-medium text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-70"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-sage-600 via-sage-500 to-sage-600 bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:100%_0]" />
          <span className="relative flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t("scoring.submitting")}
              </>
            ) : submitted ? (
              t("scoring.submitted")
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("scoring.submitScore")}
              </>
            )}
          </span>
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-300">
          {isAdmin
            ? t("scoring.adminSubmitFooter")
            : t("scoring.judgeSubmitFooter")}
        </p>
      </footer>
    </section>
  );
}
