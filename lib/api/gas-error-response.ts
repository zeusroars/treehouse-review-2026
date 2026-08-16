import { NextResponse } from "next/server";
import {
  CONNECTION_FAILED_CODE,
  toClientConnectionErrorCode,
} from "@/lib/gas/connection-error";

export function jsonGasError(
  error: unknown,
  fallback = "無法載入資料"
): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  const errorCode = toClientConnectionErrorCode(message);

  if (errorCode) {
    return NextResponse.json(
      { ok: false, error: fallback, errorCode: CONNECTION_FAILED_CODE },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: false, error: message || fallback }, { status: 502 });
}
