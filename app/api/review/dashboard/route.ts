import { NextResponse } from "next/server";
import {
  buildAdminDashboardRows,
  DIVERGENCE_TOP_N,
  EXPECTED_JUDGE_COUNT,
  TOP_N_PHASE1,
} from "@/lib/admin-dashboard";
import { isAdminJudgeId } from "@/lib/admin";

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

    if (!isAdminJudgeId(judgeId)) {
      return NextResponse.json(
        { ok: false, error: "僅限管理者存取" },
        { status: 403 }
      );
    }

    const rows = await buildAdminDashboardRows();

    return NextResponse.json({
      ok: true,
      rows,
      meta: {
        expectedJudgeCount: EXPECTED_JUDGE_COUNT,
        divergenceTopN: DIVERGENCE_TOP_N,
        topN: TOP_N_PHASE1,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法載入決選統計";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
