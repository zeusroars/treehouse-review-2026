import { NextResponse } from "next/server";
import { listDay4LoungeEntries } from "@/lib/day4-lounge/store";
import { resolveStarCount } from "@/lib/day5-board/stars";
import { isAdminJudgeId } from "@/lib/admin";

export async function GET(request: Request) {
  const judgeId = new URL(request.url).searchParams.get("judgeId");
  if (!judgeId || !isAdminJudgeId(judgeId)) {
    return NextResponse.json(
      { ok: false, error: "僅限大會主席（管理者）使用此戰情板" },
      { status: 403 }
    );
  }

  try {
    const entries = await listDay4LoungeEntries();
    return NextResponse.json({
      ok: true,
      entries: entries.map((entry) => ({
        entryId: entry.entryId,
        workTitle: entry.workTitle,
        imageUrl: entry.imageUrl,
        displayRotation: entry.displayRotation,
        starCount: resolveStarCount(entry.entryId, entry.shortlistedBy),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "無法載入決選作品",
      },
      { status: 502 }
    );
  }
}
