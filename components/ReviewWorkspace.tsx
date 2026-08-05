"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import JudgeGate from "@/components/JudgeGate";
import JudgeShell from "@/components/JudgeShell";
import EntryThumbnailStrip from "@/components/EntryThumbnailStrip";
import PreviewPanel from "@/components/PreviewPanel";
import ScoringPanel from "@/components/ScoringPanel";
import {
  clearJudgeSession,
  fetchEntries,
  fetchEntryDetail,
  isAdminSession,
  loadJudgeSession,
  type JudgeSession,
} from "@/lib/review-client";
import type { ReviewEntryDetail, ReviewEntrySummary } from "@/types/review";
import { isJudgeVisibleReviewStatus } from "@/types/review";

function firstPendingEntryId(entries: ReviewEntrySummary[]): string | null {
  return entries.find((e) => !e.reviewed)?.entryId ?? null;
}

function firstEntryId(entries: ReviewEntrySummary[]): string | null {
  return entries[0]?.entryId ?? null;
}

export default function ReviewWorkspace() {
  const [session, setSession] = useState<JudgeSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [entries, setEntries] = useState<ReviewEntrySummary[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [entryDetail, setEntryDetail] = useState<ReviewEntryDetail | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const isAdmin = session ? isAdminSession(session) : false;

  useEffect(() => {
    setSession(loadJudgeSession());
    setSessionChecked(true);
  }, []);

  const activeSummary = useMemo(
    () => entries.find((e) => e.entryId === activeEntryId) ?? null,
    [entries, activeEntryId]
  );

  const activeIndex = useMemo(
    () => entries.findIndex((e) => e.entryId === activeEntryId),
    [entries, activeEntryId]
  );

  const reviewedCount = useMemo(
    () => entries.filter((e) => e.reviewed).length,
    [entries]
  );

  const loadEntryList = useCallback(
    async (judgeId: string, adminMode: boolean) => {
      setListLoading(true);
      setListError(null);
      try {
        const result = await fetchEntries(judgeId);
        if (!result.ok || !result.entries) {
          throw new Error(result.error ?? "無法載入作品清單");
        }
        const approvedEntries = result.entries.filter((item) =>
          isJudgeVisibleReviewStatus(item.reviewStatus)
        );
        setEntries(approvedEntries);
        setActiveEntryId((prev) => {
          if (prev && approvedEntries.some((e) => e.entryId === prev)) {
            return prev;
          }
          return adminMode
            ? firstEntryId(approvedEntries)
            : firstPendingEntryId(approvedEntries);
        });
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "連線逾時，請確認 GAS_WEB_APP_URL 是否已設定"
            : err instanceof Error
              ? err.message
              : "載入失敗";
        setListError(message);
        setEntries([]);
        setActiveEntryId(null);
      } finally {
        setListLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!session?.judgeId) return;
    void loadEntryList(session.judgeId, isAdminSession(session));
  }, [session, loadEntryList]);

  useEffect(() => {
    if (!session?.judgeId || !activeEntryId) {
      setEntryDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setCurrentPage(1);

    void fetchEntryDetail(session.judgeId, activeEntryId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok || !result.entry) {
          throw new Error(result.error ?? "無法載入作品");
        }
        setEntryDetail(result.entry);
        setListError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setEntryDetail(null);
          setListError(err instanceof Error ? err.message : "載入作品失敗");
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.judgeId, activeEntryId]);

  const goToEntryByOffset = useCallback(
    (offset: number) => {
      if (activeIndex < 0) return;
      const next = entries[activeIndex + offset];
      if (next) setActiveEntryId(next.entryId);
    },
    [activeIndex, entries]
  );

  const handleScoreSubmitted = (nextEntryId?: string | null) => {
    if (!session?.judgeId || !activeEntryId) return;

    if (isAdmin) {
      if (nextEntryId) {
        setTimeout(() => setActiveEntryId(nextEntryId), 500);
      } else {
        goToEntryByOffset(1);
      }
      void loadEntryList(session.judgeId, true);
      return;
    }

    setEntries((prev) => {
      const updated = prev.map((e) =>
        e.entryId === activeEntryId ? { ...e, reviewed: true } : e
      );

      let nextId: string | null = null;
      if (
        nextEntryId &&
        updated.some((e) => e.entryId === nextEntryId && !e.reviewed)
      ) {
        nextId = nextEntryId;
      } else {
        nextId = firstPendingEntryId(updated);
      }

      setTimeout(() => setActiveEntryId(nextId), 500);
      return updated;
    });
  };

  const handleSignOut = () => {
    clearJudgeSession();
    setSession(null);
    setEntries([]);
    setEntryDetail(null);
    setActiveEntryId(null);
  };

  if (!sessionChecked) {
    return null;
  }

  if (!session) {
    return (
      <JudgeShell>
        <JudgeGate onAuthenticated={setSession} />
      </JudgeShell>
    );
  }

  if (listLoading && entries.length === 0) {
    return (
      <JudgeShell>
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
          載入待審作品清單…
        </div>
      </JudgeShell>
    );
  }

  if (entries.length === 0) {
    return (
      <JudgeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <p className="text-lg font-light text-slate-700">目前沒有報名作品</p>
        <p className="max-w-md text-sm leading-relaxed text-slate-500">
          請確認 `.env.local` 已設定{" "}
          <code className="text-xs">GAS_WEB_APP_URL</code>，且 GAS 回傳的
          2D 陣列含有「圖片雲端網址」或「作品理念」等資料。
        </p>
        <p className="text-xs text-slate-400">
          診斷：
          <a
            href="/api/review/sheet-probe"
            className="ml-1 text-sage-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            /api/review/sheet-probe
          </a>
        </p>
        <button
          type="button"
          onClick={() => loadEntryList(session.judgeId, isAdmin)}
          className="text-sm text-sage-600 underline"
        >
          重新載入
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-slate-400 underline"
        >
          返回登入
        </button>
        </div>
      </JudgeShell>
    );
  }

  if (listError && !activeSummary) {
    return (
      <JudgeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
        <p className="text-sm text-red-600">{listError}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => loadEntryList(session.judgeId, isAdmin)}
            className="rounded-xl bg-sage-600 px-4 py-2 text-sm text-white"
          >
            重試
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            返回登入
          </button>
        </div>
        </div>
      </JudgeShell>
    );
  }

  const hasPending = entries.some((e) => !e.reviewed);

  if (!isAdmin && (!hasPending || !activeSummary)) {
    return (
      <JudgeShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20">
        <p className="text-lg font-light text-slate-700">所有作品皆已審查完畢</p>
        <p className="text-sm text-slate-400">感謝您的評審，{session.judgeName}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 text-sm text-sage-600 underline"
        >
          登出
        </button>
        </div>
      </JudgeShell>
    );
  }

  if (!activeSummary) {
    return null;
  }

  const totalWorks = entries.length;
  const currentWork = isAdmin
    ? activeIndex + 1
    : Math.min(reviewedCount + 1, totalWorks);

  return (
    <JudgeShell fill>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <EntryThumbnailStrip
        entries={entries}
        activeEntryId={activeSummary.entryId}
        onSelectEntry={setActiveEntryId}
        loading={listLoading}
        isAdmin={isAdmin}
      />
      <PreviewPanel
        entryId={activeSummary.entryId}
        files={entryDetail?.files ?? []}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        loading={detailLoading}
        displayRotation={entryDetail?.displayRotation}
      />
      <ScoringPanel
        judgeId={session.judgeId}
        judgeName={session.judgeName}
        isAdmin={isAdmin}
        currentWork={currentWork}
        totalWorks={totalWorks}
        entryId={activeSummary.entryId}
        category={entryDetail?.category ?? activeSummary.category}
        designConcept={entryDetail?.designConcept ?? ""}
        workTitle={entryDetail?.workTitle}
        workConcept={entryDetail?.workConcept}
        workConceptExtra={entryDetail?.workConceptExtra}
        scoreCount={activeSummary.scoreCount}
        canGoPrev={activeIndex > 0}
        canGoNext={activeIndex >= 0 && activeIndex < entries.length - 1}
        onGoPrev={() => goToEntryByOffset(-1)}
        onGoNext={() => goToEntryByOffset(1)}
        onScoreSubmitted={handleScoreSubmitted}
        onSignOut={handleSignOut}
      />
      </main>
    </JudgeShell>
  );
}
