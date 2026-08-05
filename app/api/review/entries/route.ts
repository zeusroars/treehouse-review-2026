import { NextResponse } from "next/server";
import { listEntries } from "@/lib/entries-provider";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId")?.trim();
    if (!judgeId) {
      return NextResponse.json(
        { ok: false, error: "缺少 judgeId" },
        { status: 400 }
      );
    }

    const result = await listEntries(judgeId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法載入作品清單";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
