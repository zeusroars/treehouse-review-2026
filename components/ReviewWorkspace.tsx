"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ConnectionErrorState from "@/components/ConnectionErrorState";
import EmptyEntriesState from "@/components/EmptyEntriesState";
import JudgeGate from "@/components/JudgeGate";
import JudgeShell from "@/components/JudgeShell";
import EntryThumbnailStrip from "@/components/EntryThumbnailStrip";
import PreviewPanel from "@/components/PreviewPanel";
import ScoringPanel from "@/components/ScoringPanel";
import { isConnectionError } from "@/lib/gas/connection-error";
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
  const [listConnectionError, setListConnectionError] = useState(false);

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
    async (judgeId: string, adminMode: boolean, options?: { force?: boolean }) => {
      setListLoading(true);
      setListConnectionError(false);
      try {
        const result = await fetchEntries(judgeId, { force: options?.force });
        if (!result.ok || !result.entries) {
          throw new Error("無法載入作品清單");
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
        setListConnectionError(true);
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
      })
      .catch((err) => {
        if (!cancelled) {
          setEntryDetail(null);
          if (isConnectionError(err)) {
            setListConnectionError(true);
          }
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

  if (listLoading && entries.length === 0 && !listConnectionError) {
    return (
      <JudgeShell>
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
          載入待審作品清單…
        </div>
      </JudgeShell>
    );
  }

  if (listConnectionError) {
    return (
      <JudgeShell>
        <ConnectionErrorState
          className="flex-1"
          retrying={listLoading}
          onRetry={() => void loadEntryList(session.judgeId, isAdmin, { force: true })}
        />
        <div className="pb-8 text-center">
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

  if (entries.length === 0) {
    return (
      <JudgeShell>
        <EmptyEntriesState className="flex-1" />
        <div className="pb-8 text-center">
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
