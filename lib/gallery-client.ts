"use client";

import {
  CONNECTION_FAILED_CODE,
  ConnectionError,
  toClientConnectionErrorCode,
} from "@/lib/gas/connection-error";
import { fetchWithCache, invalidateFetchCache } from "@/lib/client/fetch-cache";
import type { GalleryEntriesResponse, GalleryEntryWithVotes } from "@/types/gallery";

const GALLERY_CACHE_KEY = "gallery:entries";
const GALLERY_CACHE_TTL_MS = 30_000;
const GALLERY_FETCH_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseGalleryResponse(res: Response, data: GalleryEntriesResponse): GalleryEntryWithVotes[] {
  if (!res.ok || !data.ok || !data.entries) {
    const errorCode =
      typeof data === "object" && data && "errorCode" in data
        ? String((data as { errorCode?: string }).errorCode ?? "")
        : "";
    const errorMessage =
      typeof data === "object" && data && "error" in data
        ? String(data.error ?? "")
        : "";

    if (
      errorCode === CONNECTION_FAILED_CODE ||
      toClientConnectionErrorCode(errorMessage)
    ) {
      throw new ConnectionError();
    }

    throw new Error(errorMessage || "無法載入畫廊作品");
  }

  return data.entries.map((entry) => ({
    ...entry,
    voteCount: entry.voteCount ?? 0,
  }));
}

export async function fetchGalleryEntries(options?: {
  force?: boolean;
}): Promise<GalleryEntryWithVotes[]> {
  if (options?.force) {
    invalidateFetchCache(GALLERY_CACHE_KEY);
  }

  return fetchWithCache(
    GALLERY_CACHE_KEY,
    async () => {
      const res = await fetchWithTimeout("/api/gallery/entries", {
        cache: "no-store",
      }, GALLERY_FETCH_TIMEOUT_MS);
      const data = (await res.json()) as GalleryEntriesResponse;
      return parseGalleryResponse(res, data);
    },
    GALLERY_CACHE_TTL_MS
  );
}
