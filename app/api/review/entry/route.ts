import { NextResponse } from "next/server";
import { getEntryDetail } from "@/lib/entries-provider";
import { jsonGasError } from "@/lib/api/gas-error-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId")?.trim();
    const entryId = searchParams.get("entryId")?.trim();

    if (!judgeId || !entryId) {
      return NextResponse.json(
        { ok: false, error: "缺少 judgeId 或 entryId" },
        { status: 400 }
      );
    }

    const result = await getEntryDetail(judgeId, entryId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (e) {
    return jsonGasError(e, "無法載入作品");
  }
}
