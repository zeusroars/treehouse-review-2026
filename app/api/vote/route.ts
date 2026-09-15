import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { submitVoteToGas } from "@/lib/gas/submit-vote";

/** Authenticated vote proxy. voterId always comes from the session (never the client body). */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const voterId = session?.voterId?.trim();
    if (!voterId) {
      return NextResponse.json(
        { ok: false, status: "error", message: "請先登入後再投票" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { photoNo?: string };
    const photoNo = body.photoNo?.trim();
    if (!photoNo) {
      return NextResponse.json(
        { ok: false, status: "error", message: "缺少 photoNo" },
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
