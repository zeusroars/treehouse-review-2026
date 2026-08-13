"use client";

import { Fragment, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel, getCriteriaForCategory } from "@/lib/criteria";
import type { AdminDashboardRow } from "@/types/review";

interface AdminScoreDetailModalProps {
  row: AdminDashboardRow | null;
  onClose: () => void;
}

export default function AdminScoreDetailModal({
  row,
  onClose,
}: AdminScoreDetailModalProps) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!row) return;

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [row, handleKeyDown]);

  if (!row) return null;

  const criteria = getCriteriaForCategory(row.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-score-detail-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          aria-label={t("adminDashboard.modalClose")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 pr-14">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
              {row.thumbnailUrl ? (
                <RotatedContainImage
                  src={row.thumbnailUrl}
                  alt={row.entryId}
                  rotation={row.displayRotation ?? 0}
                  layout="fill"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-300">
                  —
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="admin-score-detail-title"
                className="font-mono text-lg font-semibold text-slate-800"
              >
                {row.entryId}
              </h2>
              {row.workTitle ? (
                <p className="mt-0.5 truncate text-sm text-slate-600">
                  {row.workTitle}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">
                {categoryLabel(row.category)} ·{" "}
                {t("adminDashboard.modalScoreSummary", {
                  completed: row.scoreCompleted,
                  total: row.scoreTotal,
                  average: row.scoreCompleted > 0 ? row.weightedAverage.toFixed(2) : "—",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(90vh-7rem)] overflow-auto px-5 py-4">
          {row.rawScores.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {t("adminDashboard.modalEmptyScores")}
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="bg-slate-50/90">
                  <th
                    rowSpan={2}
                    className="border-b border-slate-100 px-3 py-2.5 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {t("adminDashboard.modalJudgeId")}
                  </th>
                  {criteria.map((criterion) => (
                    <th
                      key={criterion.key}
                      colSpan={2}
                      className="border-b border-slate-100 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {t(`criteria.${criterion.key}`) || criterion.label}
                      <span className="ml-1 font-normal normal-case text-slate-400">
                        ({criterion.weight}%)
                      </span>
                    </th>
                  ))}
                  <th
                    rowSpan={2}
                    className="border-b border-slate-100 px-3 py-2.5 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {t("adminDashboard.modalJudgeTotal")}
                  </th>
                </tr>
                <tr className="bg-slate-50/60">
                  {criteria.map((criterion) => (
                    <Fragment key={`${criterion.key}-subheads`}>
                      <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {t("adminDashboard.modalRawScore")}
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {t("adminDashboard.modalWeightedScore")}
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {row.rawScores.map((rawScore) => (
                  <tr key={rawScore.judgeId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-slate-700">
                      {rawScore.judgeId}
                    </td>
                    {criteria.map((criterion) => {
                      const raw = rawScore.scores[criterion.key] ?? 0;
                      const weighted = raw * (criterion.weight / 100);
                      return (
                        <Fragment key={`${rawScore.judgeId}-${criterion.key}`}>
                          <td className="px-3 py-2.5 font-mono tabular-nums text-slate-800">
                            {raw.toFixed(0)}
                          </td>
                          <td className="px-3 py-2.5 font-mono tabular-nums text-sage-700">
                            {weighted.toFixed(2)}
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-sage-700">
                      {rawScore.weightedTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/60">
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-500">
                    {t("adminDashboard.modalAverage")}
                  </td>
                  {criteria.map((criterion) => {
                    const rawAvg =
                      row.rawScores.length > 0
                        ? row.rawScores.reduce(
                            (sum, item) => sum + (item.scores[criterion.key] ?? 0),
                            0
                          ) / row.rawScores.length
                        : 0;
                    const weightedAvg = rawAvg * (criterion.weight / 100);
                    return (
                      <Fragment key={`avg-${criterion.key}`}>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold tabular-nums text-slate-700">
                          {row.rawScores.length > 0 ? rawAvg.toFixed(2) : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold tabular-nums text-sage-700">
                          {row.rawScores.length > 0 ? weightedAvg.toFixed(2) : "—"}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-slate-800">
                    {row.scoreCompleted > 0 ? row.weightedAverage.toFixed(2) : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
