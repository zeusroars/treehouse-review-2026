import { NextResponse } from "next/server";
import { createAdminSession, isAdminAccessCode } from "@/lib/admin";

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

    return NextResponse.json(
      { ok: false, error: "通行碼無效（目前僅開放管理者 admin 測試）" },
      { status: 401 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "驗證失敗";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
