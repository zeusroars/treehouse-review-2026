import { fetchGasRawGrid } from "@/lib/gas/fetch-grid";
import { parseGasGridToEntries } from "@/lib/gas/parse-grid";
import type { ReviewEntryDetail } from "@/types/review";

/**
 * How long a fresh cache entry is considered "hot" (no re-fetch).
 * 5 minutes — balances freshness vs. Google API quota.
 */
const CACHE_FRESH_MS = 5 * 60_000;

/**
 * How long a stale cache entry can still be served while a background
 * refresh is in progress (stale-while-revalidate window).
 * 30 minutes — prevents hard failures after extended quiet periods.
 */
const CACHE_STALE_MS = 30 * 60_000;

interface CacheEntry {
  at: number;
  entries: ReviewEntryDetail[];
}

let cache: CacheEntry | null = null;
let inflight: Promise<ReviewEntryDetail[]> | null = null;

async function fetchAndParseEntries(): Promise<ReviewEntryDetail[]> {
  const grid = await fetchGasRawGrid();
  return parseGasGridToEntries(grid);
}

/** Trigger a background refresh without blocking the caller. */
function revalidateInBackground(): void {
  if (inflight) return; // already refreshing

  inflight = (async () => {
    try {
      const entries = await fetchAndParseEntries();
      cache = { at: Date.now(), entries };
      return entries;
    } catch {
      // Swallow — the stale cache will keep being served
      return cache?.entries ?? [];
    } finally {
      inflight = null;
    }
  })();
}

export async function loadAllEntriesFromGas(): Promise<ReviewEntryDetail[]> {
  const now = Date.now();
  const age = cache ? now - cache.at : Infinity;

  // ── FRESH: serve immediately, no fetch needed ──
  if (cache && age < CACHE_FRESH_MS) {
    return cache.entries;
  }

  // ── STALE: serve stale data, trigger background refresh ──
  if (cache && age < CACHE_STALE_MS) {
    revalidateInBackground();
    return cache.entries;
  }

  // ── EXPIRED / EMPTY: must wait for a fresh fetch ──
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
        // Extend stale window on error to avoid hammering GAS
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

/** Expose cache age for diagnostic endpoints. */
export function getGasEntriesCacheInfo(): {
  cached: boolean;
  ageMs: number | null;
  fresh: boolean;
  stale: boolean;
} {
  if (!cache) return { cached: false, ageMs: null, fresh: false, stale: false };
  const ageMs = Date.now() - cache.at;
  return {
    cached: true,
    ageMs,
    fresh: ageMs < CACHE_FRESH_MS,
    stale: ageMs >= CACHE_FRESH_MS && ageMs < CACHE_STALE_MS,
  };
}
