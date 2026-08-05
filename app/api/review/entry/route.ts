import { NextResponse } from "next/server";
import { getEntryDetail } from "@/lib/entries-provider";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId")?.trim();
    const entryId = searchParams.get("entryId")?.trim();

    if (!judgeId || !entryId) {
      return NextResponse.json(
        { ok: false, error: "缺少 judgeId 或 entryId" },
        { status: 400 }
      );
    }

    const result = await getEntryDetail(judgeId, entryId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法載入作品";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
