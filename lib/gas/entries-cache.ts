import { fetchGasRawGrid } from "@/lib/gas/fetch-grid";
import { parseGasGridToEntries } from "@/lib/gas/parse-grid";
import type { ReviewEntryDetail } from "@/types/review";

const CACHE_TTL_MS = 60_000;
let cache: { at: number; entries: ReviewEntryDetail[] } | null = null;
let inflight: Promise<ReviewEntryDetail[]> | null = null;

async function fetchAndParseEntries(): Promise<ReviewEntryDetail[]> {
  const grid = await fetchGasRawGrid();
  return parseGasGridToEntries(grid);
}

export async function loadAllEntriesFromGas(): Promise<ReviewEntryDetail[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.entries;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const entries = await fetchAndParseEntries();
      cache = { at: Date.now(), entries };
      return entries;
    } catch (e) {
      if (cache) {
        return cache.entries;
      }
      throw e;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearGasEntriesCache(): void {
  cache = null;
  inflight = null;
}
