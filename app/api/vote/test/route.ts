import { NextResponse } from "next/server";
import { submitVoteToGas } from "@/lib/gas/submit-vote";

/** Server-side proxy: avoids browser CORS when calling Google Apps Script. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      photoNo?: string;
      voterId?: string;
    };

    const photoNo = body.photoNo?.trim();
    const voterId = body.voterId?.trim();

    if (!photoNo || !voterId) {
      return NextResponse.json(
        { ok: false, status: "error", message: "缺少 photoNo 或 voterId" },
        { status: 400 }
      );
    }

    const result = await submitVoteToGas({ photoNo, voterId });

    return NextResponse.json(
      {
        ok: result.ok,
        status: result.status,
        message: result.message,
        remainingVotes: result.remainingVotes,
      },
      { status: result.ok ? 200 : 422 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "投票失敗";
    return NextResponse.json(
      { ok: false, status: "error", message },
      { status: 500 }
    );
  }
}
