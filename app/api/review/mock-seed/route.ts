import { NextResponse } from "next/server";
import {
  defaultComments,
  getCriteriaForCategory,
} from "@/lib/criteria";
import { listApprovedReviewEntries } from "@/lib/entries-provider";
import {
  clearAllScores,
  writeAllScores,
  type StoredScore,
} from "@/lib/scores/local-store";
import type { EntryCategory } from "@/types/review";

const MOCK_JUDGE_COUNT = 6;
const MOCK_SCORE_MIN = 1;
const MOCK_SCORE_MAX = 10;
const MOCK_SCORE_STEP = 0.5;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Random score from 1.0 to 10.0 inclusive, in 0.5 increments (matches slider step). */
function randomScore(): number {
  const stepCount = (MOCK_SCORE_MAX - MOCK_SCORE_MIN) / MOCK_SCORE_STEP;
  const index = Math.floor(Math.random() * (stepCount + 1));
  return MOCK_SCORE_MIN + index * MOCK_SCORE_STEP;
}

function mockJudgeId(index: number): string {
  return `judge_${index}`;
}

function buildRandomScores(category: EntryCategory): Record<string, number> {
  const criteria = getCriteriaForCategory(category);
  return Object.fromEntries(
    criteria.map((criterion) => [criterion.key, randomScore()])
  );
}

async function buildMockScores(
  approvedEntries: Awaited<ReturnType<typeof listApprovedReviewEntries>>
): Promise<StoredScore[]> {
  const rows: StoredScore[] = [];
  const baseTime = Date.now();
  let sequence = 0;

  for (let judgeIndex = 1; judgeIndex <= MOCK_JUDGE_COUNT; judgeIndex++) {
    for (const entry of approvedEntries) {
      const criteria = getCriteriaForCategory(entry.category);
      rows.push({
        judgeId: mockJudgeId(judgeIndex),
        entryId: entry.entryId,
        category: entry.category,
        scores: buildRandomScores(entry.category),
        comments: defaultComments(criteria),
        timestamp: new Date(baseTime + sequence).toISOString(),
      });
      sequence += 1;
    }
  }

  return rows;
}

export async function GET(request: Request) {
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "此 API 僅限本地開發環境使用" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim();

  if (action === "clear") {
    await clearAllScores();
    return NextResponse.json({ message: "所有評分資料已成功歸零" });
  }

  if (action === "seed") {
    await clearAllScores();
    const approvedEntries = await listApprovedReviewEntries();
    const rows = await buildMockScores(approvedEntries);
    await writeAllScores(rows);

    return NextResponse.json({
      message: `成功生成 ${rows.length} 筆符合 1-10 滑軌尺度的模擬評分資料`,
      entryCount: approvedEntries.length,
      judgeCount: MOCK_JUDGE_COUNT,
    });
  }

  return NextResponse.json(
    {
      error: "請提供有效的 action 參數（seed 或 clear）",
      usage: {
        clear: "/api/review/mock-seed?action=clear",
        seed: "/api/review/mock-seed?action=seed",
      },
    },
    { status: 400 }
  );
}
