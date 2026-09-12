import { ADMIN_JUDGE_ID } from "@/lib/admin";
import { getCriteriaForCategory, weightedTotal } from "@/lib/criteria";
import {
  ADMIN_LIST_THUMB_WIDTH,
  buildDriveThumbnailProxyUrl,
} from "@/lib/drive-thumbnail";
import { loadAllEntriesFromGas } from "@/lib/gas/entries-cache";
import { readAllScores, type StoredScore } from "@/lib/scores/local-store";
import type { AdminDashboardRow } from "@/types/review";
import { isJudgeVisibleReviewStatus } from "@/types/review";

export const DIVERGENCE_TOP_N = 3;
export const TOP_N_PHASE1 = 15;
export const EXPECTED_JUDGE_COUNT =
  Number(process.env.EXPECTED_JUDGE_COUNT) || 6;

function latestScoresByJudge(scores: StoredScore[]): Map<string, StoredScore> {
  const map = new Map<string, StoredScore>();
  for (const score of scores) {
    const prev = map.get(score.judgeId);
    if (!prev || score.timestamp > prev.timestamp) {
      map.set(score.judgeId, score);
    }
  }
  return map;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Cutoff divergence for the top-N highest-divergence entries (includes ties). */
function getTopDivergenceCutoff(rows: AdminDashboardRow[]): number | null {
  const divergences = rows
    .filter((row) => row.scoreCompleted >= 2)
    .map((row) => row.divergence)
    .sort((a, b) => b - a);

  if (divergences.length === 0) return null;

  const cutoffIndex = Math.min(DIVERGENCE_TOP_N - 1, divergences.length - 1);
  return divergences[cutoffIndex];
}

export async function buildAdminDashboardRows(): Promise<AdminDashboardRow[]> {
  const allScores = await readAllScores();
  const judgeScores = allScores.filter((s) => s.judgeId !== ADMIN_JUDGE_ID);

  const scoresByEntry = new Map<string, StoredScore[]>();
  for (const score of judgeScores) {
    const bucket = scoresByEntry.get(score.entryId) ?? [];
    bucket.push(score);
    scoresByEntry.set(score.entryId, bucket);
  }

  const entries = await loadAllEntriesFromGas();
  const approved = entries.filter((entry) =>
    isJudgeVisibleReviewStatus(entry.reviewStatus)
  );

  const rows: AdminDashboardRow[] = approved.map((entry) => {
    const entryScores = scoresByEntry.get(entry.entryId) ?? [];
    const latestByJudge = latestScoresByJudge(entryScores);
    const rawScores = [...latestByJudge.values()]
      .map((score) => {
        const criteria = getCriteriaForCategory(score.category || entry.category);
        return {
          judgeId: score.judgeId,
          scores: Object.fromEntries(
            criteria.map((criterion) => [
              criterion.key,
              score.scores[criterion.key] ?? 0,
            ])
          ),
          weightedTotal: round2(weightedTotal(criteria, score.scores)),
        };
      })
      .sort((a, b) => a.judgeId.localeCompare(b.judgeId));

    const judgeTotals = rawScores.map((score) => score.weightedTotal);

    const scoreCompleted = judgeTotals.length;
    const weightedAverage =
      scoreCompleted > 0
        ? judgeTotals.reduce((sum, total) => sum + total, 0) / scoreCompleted
        : 0;
    const divergence =
      scoreCompleted >= 2
        ? Math.max(...judgeTotals) - Math.min(...judgeTotals)
        : 0;

    const first = entry.files[0];

    return {
      entryId: entry.entryId,
      workTitle: entry.workTitle,
      category: entry.category,
      thumbnailUrl:
        first?.type === "image" && first.fileId
          ? buildDriveThumbnailProxyUrl(first.fileId, ADMIN_LIST_THUMB_WIDTH)
          : null,
      displayRotation: entry.displayRotation,
      scoreCompleted,
      scoreTotal: EXPECTED_JUDGE_COUNT,
      weightedAverage: round2(weightedAverage),
      divergence: round2(divergence),
      scoreRank: null,
      needsDiscussion: false,
      rawScores,
    };
  });

  const ranked = rows
    .filter((row) => row.scoreCompleted > 0)
    .sort((a, b) => b.weightedAverage - a.weightedAverage);

  ranked.forEach((row, index) => {
    const target = rows.find((item) => item.entryId === row.entryId);
    if (target) target.scoreRank = index + 1;
  });

  const divergenceCutoff = getTopDivergenceCutoff(rows);

  for (const row of rows) {
    row.needsDiscussion =
      divergenceCutoff != null &&
      row.scoreCompleted >= 2 &&
      row.divergence >= divergenceCutoff &&
      row.scoreRank != null &&
      row.scoreRank > TOP_N_PHASE1;
  }

  return rows;
}
