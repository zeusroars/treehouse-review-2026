"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  Download,
  Eye,
  Flame,
  Loader2,
  Shield,
} from "lucide-react";
import JudgeShell from "@/components/JudgeShell";
import AdminScoreDetailModal from "@/components/judge/AdminScoreDetailModal";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel } from "@/lib/criteria";
import { downloadDashboardXlsx } from "@/lib/admin-dashboard-xlsx";
import {
  fetchAdminDashboard,
  isAdminSession,
  loadJudgeSession,
} from "@/lib/review-client";
import type { AdminDashboardRow } from "@/types/review";

type SortKey = "weightedAverage" | "divergence";
type SortDir = "asc" | "desc";
type FilterMode = "all" | "top15" | "controversial";

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDir;
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminDashboardRow[]>([]);
  const [topN, setTopN] = useState(15);
  const [divergenceTopN, setDivergenceTopN] = useState(3);
  const [sortKey, setSortKey] = useState<SortKey>("weightedAverage");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [detailRow, setDetailRow] = useState<AdminDashboardRow | null>(null);

  useEffect(() => {
    const session = loadJudgeSession();
    if (!session || !isAdminSession(session)) {
      router.replace("/judge");
      return;
    }
    setAuthorized(true);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAdminDashboard(session.judgeId);
        if (cancelled) return;
        if (!result.ok || !result.rows) {
          setError(result.error ?? t("adminDashboard.loadFailed"));
          return;
        }
        setRows(result.rows);
        if (result.meta?.topN) setTopN(result.meta.topN);
        if (result.meta?.divergenceTopN) setDivergenceTopN(result.meta.divergenceTopN);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("adminDashboard.loadFailed")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "weightedAverage" ? "desc" : "desc");
      }
    },
    [sortKey]
  );

  const filteredRows = useMemo(() => {
    let list = [...rows];
    if (filter === "top15") {
      list = list.filter(
        (row) => row.scoreRank != null && row.scoreRank <= topN
      );
    } else if (filter === "controversial") {
      list = list.filter((row) => row.needsDiscussion);
    }

    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av === bv ? 0 : av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [rows, filter, topN, sortKey, sortDir]);

  const stats = useMemo(() => {
    const scored = rows.filter((row) => row.scoreCompleted > 0);
    const topCount = scored.filter(
      (row) => row.scoreRank != null && row.scoreRank <= topN
    ).length;
    const controversialCount = rows.filter((row) => row.needsDiscussion).length;
    return { total: rows.length, scored: scored.length, topCount, controversialCount };
  }, [rows, topN]);

  const handleExportXlsx = useCallback(() => {
    downloadDashboardXlsx(rows, topN);
  }, [rows, topN]);

  if (!authorized) {
    return (
      <JudgeShell showPhaseNav>
        <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </JudgeShell>
    );
  }

  return (
    <JudgeShell showPhaseNav>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/judge"
              className="mb-3 inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-sage-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("adminDashboard.backToReview")}
            </Link>
            <div className="flex items-center gap-2 text-amber-700">
              <Shield className="h-5 w-5" />
              <h1 className="text-2xl font-light tracking-tight text-slate-800">
                {t("adminDashboard.title")}
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {t("adminDashboard.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", t("adminDashboard.filterAll")],
                ["top15", t("adminDashboard.filterTop15", { count: topN })],
                ["controversial", t("adminDashboard.filterControversial")],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === mode
                    ? "bg-sage-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleExportXlsx}
              disabled={loading || rows.filter((row) => row.scoreCompleted > 0).length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {t("adminDashboard.exportExcel")}
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("adminDashboard.statTotal"),
              value: stats.total,
              icon: BarChart3,
            },
            {
              label: t("adminDashboard.statScored"),
              value: stats.scored,
              icon: BarChart3,
            },
            {
              label: t("adminDashboard.statTopN", { count: topN }),
              value: stats.topCount,
              icon: BarChart3,
            },
            {
              label: t("adminDashboard.statControversial"),
              value: stats.controversialCount,
              icon: Flame,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("adminDashboard.loading")}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("adminDashboard.colThumbnail")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("adminDashboard.colEntryId")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("adminDashboard.colScoreCount")}
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("weightedAverage")}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-sage-700"
                      >
                        {t("adminDashboard.colWeightedAverage")}
                        <SortIcon
                          active={sortKey === "weightedAverage"}
                          direction={sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("divergence")}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-sage-700"
                      >
                        {t("adminDashboard.colDivergence")}
                        <SortIcon
                          active={sortKey === "divergence"}
                          direction={sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("adminDashboard.colStatus")}
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {t("adminDashboard.colDetail")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-slate-400"
                      >
                        {t("adminDashboard.empty")}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isTop =
                        row.scoreRank != null && row.scoreRank <= topN;
                      return (
                        <tr
                          key={row.entryId}
                          className={`transition-colors ${
                            row.needsDiscussion
                              ? "bg-amber-50/90 hover:bg-amber-50"
                              : "hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                              {row.thumbnailUrl ? (
                                <RotatedContainImage
                                  src={row.thumbnailUrl}
                                  alt={row.entryId}
                                  rotation={row.displayRotation ?? 0}
                                  layout="fill"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-slate-300">
                                  —
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs font-medium text-slate-800">
                              {row.entryId}
                            </div>
                            {row.workTitle ? (
                              <div className="mt-0.5 max-w-[12rem] truncate text-xs text-slate-500">
                                {row.workTitle}
                              </div>
                            ) : null}
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {categoryLabel(row.category)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 font-mono text-xs ${
                                row.scoreCompleted >= row.scoreTotal
                                  ? "bg-sage-100 text-sage-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {row.scoreCompleted}/{row.scoreTotal}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-semibold tabular-nums text-slate-800">
                                {row.scoreCompleted > 0
                                  ? row.weightedAverage.toFixed(2)
                                  : "—"}
                              </span>
                              {isTop && row.scoreCompleted > 0 ? (
                                <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[10px] font-medium text-sage-700">
                                  #{row.scoreRank}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-mono text-sm tabular-nums ${
                                row.needsDiscussion
                                  ? "font-semibold text-amber-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {row.scoreCompleted >= 2
                                ? row.divergence.toFixed(2)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {isTop && row.scoreCompleted > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-sage-600/10 px-2 py-0.5 text-[10px] font-medium text-sage-700">
                                  {t("adminDashboard.badgeTopN", { count: topN })}
                                </span>
                              ) : null}
                              {row.needsDiscussion ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                  {t("adminDashboard.badgeNeedsDiscussion")}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setDetailRow(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t("adminDashboard.viewDetail")}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] text-slate-400">
              {t("adminDashboard.footerHint", {
                divergenceTopN,
                count: topN,
              })}
            </div>
          </div>
        )}
      </div>

      <AdminScoreDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
      />
    </JudgeShell>
  );
}
