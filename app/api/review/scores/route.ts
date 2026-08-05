import { NextResponse } from "next/server";
import { submitScore } from "@/lib/entries-provider";
import type { SubmitScorePayload } from "@/types/review";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitScorePayload;

    if (!body.judgeId || !body.entryId || !body.category) {
      return NextResponse.json(
        { ok: false, error: "提交資料不完整" },
        { status: 400 }
      );
    }

    const result = await submitScore(body);
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "評分提交失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
