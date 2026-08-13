import { NextResponse } from "next/server";
import { createAdminSession, isAdminAccessCode } from "@/lib/admin";
import { createJudgeSession, resolveJudgeByPasscode } from "@/lib/judges";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "請輸入評審通行碼" },
        { status: 400 }
      );
    }

    if (isAdminAccessCode(code)) {
      return NextResponse.json({ ok: true, ...createAdminSession() });
    }

    const judge = resolveJudgeByPasscode(code);
    if (judge) {
      return NextResponse.json({ ok: true, ...createJudgeSession(judge) });
    }

    return NextResponse.json(
      { ok: false, error: "通行碼無效" },
      { status: 401 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "驗證失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
