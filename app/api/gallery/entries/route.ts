import { NextResponse } from "next/server";
import { listPublicGalleryEntries } from "@/lib/entries-provider";
import { VOTE_COUNTS_REVALIDATE_SECONDS } from "@/lib/gas/fetch-vote-counts";

export const revalidate = VOTE_COUNTS_REVALIDATE_SECONDS;

export async function GET() {  try {
    const result = await listPublicGalleryEntries();
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法載入畫廊作品";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
