import { getGasVoteFetchUrl } from "@/lib/gas/config";
import { fetchGasJson } from "@/lib/gas/fetch-gas";

export const VOTE_COUNTS_REVALIDATE_SECONDS = 60;

function parseCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function parseFlatCounts(obj: Record<string, unknown>): Record<string, number> {
  const skip = new Set([
    "status",
    "ok",
    "message",
    "error",
    "counts",
    "votes",
    "data",
  ]);
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (skip.has(key)) continue;
    if (typeof value === "number" || typeof value === "string") {
      result[key] = parseCount(value);
    }
  }

  return result;
}

function parseVoteGrid(grid: string[][]): Record<string, number> {
  if (grid.length < 2) return {};
  const header = grid[0].map((h) => String(h).trim().toLowerCase());
  const photoIdx = header.findIndex((h) =>
    ["photono", "photo_no", "entryid", "entry_id", "編號", "作品編號"].some(
      (k) => h.includes(k)
    )
  );
  const countIdx = header.findIndex((h) =>
    ["count", "votes", "vote", "票數", "得票", "total"].some((k) =>
      h.includes(k)
    )
  );

  const keyCol = photoIdx >= 0 ? photoIdx : 0;
  const valCol = countIdx >= 0 ? countIdx : 1;
  const result: Record<string, number> = {};

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row?.length) continue;
    const photoNo = String(row[keyCol] ?? "").trim();
    if (!photoNo) continue;
    result[photoNo] = parseCount(row[valCol]);
  }

  return result;
}

/** Normalize GAS GET response into { [photoNo]: voteCount }. */
export function parseVoteCountsPayload(data: unknown): Record<string, number> {
  if (!data) return {};

  if (Array.isArray(data)) {
    if (data.length > 0 && Array.isArray(data[0])) {
      return parseVoteGrid(data as string[][]);
    }

    const fromRows: Record<string, number> = {};
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      const photoNo = String(
        record.photoNo ?? record.entryId ?? record.id ?? ""
      ).trim();
      const count = record.count ?? record.votes ?? record.voteCount;
      if (photoNo) fromRows[photoNo] = parseCount(count);
    }
    return fromRows;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.status === "success" && obj.data && typeof obj.data === "object") {
      return parseVoteCountsPayload(obj.data);
    }
    if (obj.counts && typeof obj.counts === "object") {
      return parseFlatCounts(obj.counts as Record<string, unknown>);
    }
    if (obj.votes && typeof obj.votes === "object") {
      return parseFlatCounts(obj.votes as Record<string, unknown>);
    }
    if (obj.data) return parseVoteCountsPayload(obj.data);
    return parseFlatCounts(obj);
  }

  return {};
}

/**
 * Fetch vote totals from GAS with ISR cache (revalidate every 60s).
 */
export async function fetchVoteCountsFromGas(): Promise<Record<string, number>> {
  const url = getGasVoteFetchUrl();
  const data = await fetchGasJson<unknown>(url, {
    label: "GAS vote GET",
    init: {
      method: "GET",
      next: { revalidate: VOTE_COUNTS_REVALIDATE_SECONDS },
    },
  });

  return parseVoteCountsPayload(data);
}
