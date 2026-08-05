import { fetchGasRawGrid } from "@/lib/gas/fetch-grid";
import { parseGasGridToEntries } from "@/lib/gas/parse-grid";
import type { ReviewEntryDetail } from "@/types/review";

const CACHE_TTL_MS = 60_000;
let cache: { at: number; entries: ReviewEntryDetail[] } | null = null;

export async function loadAllEntriesFromGas(): Promise<ReviewEntryDetail[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.entries;
  }

  try {
    const grid = await fetchGasRawGrid();
    const entries = parseGasGridToEntries(grid);
    cache = { at: Date.now(), entries };
    return entries;
  } catch (e) {
    if (cache) {
      return cache.entries;
    }
    throw e;
  }
}

export function clearGasEntriesCache(): void {
  cache = null;
}
