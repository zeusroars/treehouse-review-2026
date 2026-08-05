import type { Metadata } from "next";
import GalleryPageClient from "@/components/gallery/GalleryPageClient";
import { listPublicGalleryEntries } from "@/lib/entries-provider";
import { VOTE_COUNTS_REVALIDATE_SECONDS } from "@/lib/gas/fetch-vote-counts";

import type { GalleryEntryWithVotes } from "@/types/gallery";

export const metadata: Metadata = {
  title: "2026 國際樹屋設計競賽 · 線上畫廊",
  description:
    "Public gallery — 2026 International Treehouse Design Competition",
};

export const revalidate = VOTE_COUNTS_REVALIDATE_SECONDS;

export default async function GalleryPage() {
  let initialEntries: GalleryEntryWithVotes[] = [];
  let initialError: string | null = null;

  try {
    const result = await listPublicGalleryEntries();
    if (!result.ok || !result.entries) {
      initialError = result.error ?? "無法載入畫廊作品";
    } else {
      initialEntries = result.entries.map((e) => ({
        ...e,
        voteCount: e.voteCount ?? 0,
      }));
    }
  } catch (e) {
    initialError = e instanceof Error ? e.message : "無法載入畫廊作品";
  }

  return (
    <GalleryPageClient
      initialEntries={initialEntries}
      initialError={initialError}
    />
  );
}
