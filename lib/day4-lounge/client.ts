"use client";

import type {
  Day4LoungeAction,
  Day4LoungeResponse,
} from "@/types/day4-lounge";

async function parseResponse(response: Response): Promise<Day4LoungeResponse> {
  const data = (await response.json()) as Day4LoungeResponse;
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? "討論區連線失敗");
  }
  return data;
}

export async function fetchDay4Lounge(
  judgeId: string
): Promise<Day4LoungeResponse> {
  const response = await fetch(
    `/api/review/day4-lounge?judgeId=${encodeURIComponent(judgeId)}`,
    { cache: "no-store" }
  );
  return parseResponse(response);
}

export async function updateDay4Lounge(
  payload: Day4LoungeAction
): Promise<Day4LoungeResponse> {
  const response = await fetch("/api/review/day4-lounge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
