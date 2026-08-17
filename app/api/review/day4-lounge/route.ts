import { NextResponse } from "next/server";
import {
  listDay4LoungeEntries,
  mutateDay4Lounge,
} from "@/lib/day4-lounge/store";
import { listJudgeIds } from "@/lib/judges";
import type { Day4LoungeAction } from "@/types/day4-lounge";

function canView(judgeId: string | null): boolean {
  return judgeId === "ADMIN" || Boolean(judgeId && listJudgeIds().includes(judgeId));
}

export async function GET(request: Request) {
  const judgeId = new URL(request.url).searchParams.get("judgeId");
  if (!canView(judgeId)) {
    return NextResponse.json(
      { ok: false, error: "請先登入評審專區" },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({
      ok: true,
      entries: await listDay4LoungeEntries(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "無法載入討論區",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Day4LoungeAction;
    return NextResponse.json({
      ok: true,
      entries: await mutateDay4Lounge(payload),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "更新討論失敗",
      },
      { status: 400 }
    );
  }
}
