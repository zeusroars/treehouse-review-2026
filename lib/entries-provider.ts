import { hasGasWebAppUrl } from "@/lib/gas/config";
import { loadAllEntriesFromGas } from "@/lib/gas/entries-cache";
import { fetchGasRawGrid } from "@/lib/gas/fetch-grid";
import {
  getGasGridMeta,
  parseGasGridToEntries,
} from "@/lib/gas/parse-grid";
import {
  appendScore,
  findNextPendingEntryId,
  getReviewedEntryIdsForJudge,
  getScoreCountByEntry,
} from "@/lib/scores/local-store";
import type {
  EntriesListResponse,
  EntryDetailResponse,
  ReviewEntryDetail,
  SubmitScorePayload,
  SubmitScoreResponse,
} from "@/types/review";
import { isJudgeVisibleReviewStatus } from "@/types/review";
import { buildDriveThumbnailProxyUrl } from "@/lib/drive-thumbnail";
import { fetchVoteCountsFromGas } from "@/lib/gas/fetch-vote-counts";
import { mergeVoteCounts } from "@/lib/gallery-votes";
import type { GalleryEntriesResponse, GalleryEntry } from "@/types/gallery";

async function enrichAdminScoreCounts(
  result: EntriesListResponse
): Promise<EntriesListResponse> {
  if (!result.entries?.length) return result;
  const counts = await getScoreCountByEntry();
  return {
    ...result,
    entries: result.entries.map((e) => ({
      ...e,
      scoreCount: counts[e.entryId] ?? 0,
    })),
  };
}

export async function listPublicGalleryEntries(): Promise<GalleryEntriesResponse> {
  const all = await loadAllEntriesFromGas();

  let voteMap: Record<string, number> = {};
  try {
    voteMap = await fetchVoteCountsFromGas();
  } catch {
    voteMap = {};
  }

  const baseEntries: GalleryEntry[] = all.map((e) => {
    const first = e.files[0];
    return {
      entryId: e.entryId,
      category: e.category,
      workTitle: e.workTitle,
      workConcept: e.workConcept,
      fileId: first?.fileId ?? null,
      thumbnailUrl: first?.fileId
        ? buildDriveThumbnailProxyUrl(first.fileId)
        : null,
      thumbnailType: first?.type ?? null,
      displayRotation: e.displayRotation,
    };
  });

  const entries = mergeVoteCounts(baseEntries, voteMap);

  return { ok: true, entries };
}

export async function listApprovedReviewEntries(): Promise<ReviewEntryDetail[]> {
  const all = await loadAllEntriesFromGas();
  return all.filter((entry) => isJudgeVisibleReviewStatus(entry.reviewStatus));
}

export async function listEntries(judgeId: string): Promise<EntriesListResponse> {
  const all = await loadAllEntriesFromGas();
  const approved = all.filter((e) => isJudgeVisibleReviewStatus(e.reviewStatus));
  const reviewed = await getReviewedEntryIdsForJudge(judgeId);
  const isAdmin = judgeId === "ADMIN";

  const entries = approved.map((e) => {
    const first = e.files[0];
    return {
      entryId: e.entryId,
      category: e.category,
      reviewed: isAdmin ? false : reviewed.has(e.entryId),
      thumbnailUrl:
        first?.type === "image" ? first.previewUrl : null,
      thumbnailType: first?.type ?? null,
      displayRotation: e.displayRotation,
      reviewStatus: e.reviewStatus,
    };
  });

  let result: EntriesListResponse = {
    ok: true,
    entries,
    progress: {
      reviewedCount: isAdmin
        ? 0
        : entries.filter((e) => e.reviewed).length,
      total: entries.length,
    },
  };

  if (isAdmin) {
    result = await enrichAdminScoreCounts(result);
  }

  return result;
}

export async function getEntryDetail(
  _judgeId: string,
  entryId: string
): Promise<EntryDetailResponse> {
  const all = await loadAllEntriesFromGas();
  const entry = all.find((e) => e.entryId === entryId);
  if (!entry || !isJudgeVisibleReviewStatus(entry.reviewStatus)) {
    return { ok: false, error: "找不到作品" };
  }
  return { ok: true, entry };
}

export async function submitScore(
  payload: SubmitScorePayload
): Promise<SubmitScoreResponse> {
  const reviewed = await getReviewedEntryIdsForJudge(payload.judgeId);
  if (payload.judgeId !== "ADMIN" && reviewed.has(payload.entryId)) {
    return { ok: false, error: "此作品已評分" };
  }

  await appendScore(payload);

  const list = await listEntries(payload.judgeId);
  const ids = list.entries?.map((e) => e.entryId) ?? [];
  const nextEntryId = await findNextPendingEntryId(
    payload.judgeId,
    ids,
    payload.entryId
  );

  return { ok: true, nextEntryId };
}

export function getEntriesDataSource(): "gas" | "none" {
  return hasGasWebAppUrl() ? "gas" : "none";
}

export async function probeGasSheetConnection(): Promise<{
  ok: boolean;
  entryCount: number;
  headers: string[];
  dataRowCount: number;
  sampleEntryIds: string[];
  error?: string;
}> {
  try {
    const grid = await fetchGasRawGrid();
    const meta = getGasGridMeta(grid);
    const entries = parseGasGridToEntries(grid);
    return {
      ok: true,
      entryCount: entries.length,
      headers: meta.headers,
      dataRowCount: meta.dataRowCount,
      sampleEntryIds: entries.slice(0, 5).map((e) => e.entryId),
    };
  } catch (e) {
    return {
      ok: false,
      entryCount: 0,
      headers: [],
      dataRowCount: 0,
      sampleEntryIds: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
