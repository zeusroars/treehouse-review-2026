import type { Metadata } from "next";
import GalleryPageClient from "@/components/gallery/GalleryPageClient";

import type { GalleryEntryWithVotes } from "@/types/gallery";

export const metadata: Metadata = {
  title: "2026國際樹屋設計競賽(少兒組)",
  description:
    "歡迎參加 2026 國際樹屋競賽線上人氣票選！活動期間 9/15–9/30，前三名可獲飛牛牧場住宿券。由臺灣樹屋協會主辦。",
  openGraph: {
    title: "2026國際樹屋設計競賽(少兒組)",
    description:
      "歡迎參加 2026 國際樹屋競賽線上人氣票選！活動期間 9/15–9/30，前三名可獲飛牛牧場住宿券。由臺灣樹屋協會主辦。",
  },
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
