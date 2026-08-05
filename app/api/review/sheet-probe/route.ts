import { NextResponse } from "next/server";
import {
  getEntriesDataSource,
  probeGasSheetConnection,
} from "@/lib/entries-provider";

/** 診斷 GAS 唯讀連線（不修改 Google 試算表） */
export async function GET() {
  const probe = await probeGasSheetConnection();
  return NextResponse.json({
    dataSource: getEntriesDataSource(),
    probe,
  });
}
