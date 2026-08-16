import type { Metadata } from "next";
import GalleryPageClient from "@/components/gallery/GalleryPageClient";

import type { GalleryEntryWithVotes } from "@/types/gallery";

export const metadata: Metadata = {
  title: "2026 國際樹屋設計競賽 · 線上畫廊",
  description:
    "Public gallery — 2026 International Treehouse Design Competition",
};

/** Keep in sync with VOTE_COUNTS_REVALIDATE_SECONDS in lib/gas/fetch-vote-counts.ts */
export const revalidate = 60;

export default function GalleryPage() {
  const initialEntries: GalleryEntryWithVotes[] = [];

  return (
    <GalleryPageClient
      initialEntries={initialEntries}
      initialLoadFailed={false}
    />
  );
}
