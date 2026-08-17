"use client";

import { readJsonResponse } from "@/lib/safe-json-response";
import type { Day5BoardResponse } from "@/types/day5-board";

export async function fetchDay5Board(judgeId: string): Promise<Day5BoardResponse> {
  const response = await fetch(
    `/api/review/day5-board?judgeId=${encodeURIComponent(judgeId)}`,
    { cache: "no-store" }
  );
  const data = await readJsonResponse<Day5BoardResponse>(response);
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "無法載入 Day 5 戰情板");
  }
  return data;
}
