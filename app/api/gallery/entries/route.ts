import { NextResponse } from "next/server";
import { listPublicGalleryEntries } from "@/lib/entries-provider";
import { jsonGasError } from "@/lib/api/gas-error-response";

/** Keep in sync with VOTE_COUNTS_REVALIDATE_SECONDS in lib/gas/fetch-vote-counts.ts */
export const revalidate = 60;

export async function GET() {
  try {
    const result = await listPublicGalleryEntries();
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return jsonGasError(e, "無法載入畫廊作品");
  }
}
