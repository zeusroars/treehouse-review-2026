"use client";

import type {
  EntriesListResponse,
  EntryDetailResponse,
  SubmitScorePayload,
  SubmitScoreResponse,
  ValidateJudgeResponse,
} from "@/types/review";

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data && data.error
        ? String(data.error)
        : `Request failed (${res.status})`
    );
  }
  return data;
}

export async function validateJudge(code: string): Promise<ValidateJudgeResponse> {
  const res = await fetchWithTimeout("/api/review/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson(res);
}

export async function fetchEntries(judgeId: string): Promise<EntriesListResponse> {
  const res = await fetchWithTimeout(
    `/api/review/entries?judgeId=${encodeURIComponent(judgeId)}`,
    { cache: "no-store" }
  );
  return parseJson(res);
}

export async function fetchEntryDetail(
  judgeId: string,
  entryId: string
): Promise<EntryDetailResponse> {
  const res = await fetchWithTimeout(
    `/api/review/entry?judgeId=${encodeURIComponent(judgeId)}&entryId=${encodeURIComponent(entryId)}`,
    { cache: "no-store" }
  );
  return parseJson(res);
}

export async function submitScore(
  payload: SubmitScorePayload
): Promise<SubmitScoreResponse> {
  const res = await fetchWithTimeout("/api/review/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export const JUDGE_SESSION_KEY = "treehouse-review-judge";

export interface JudgeSession {
  judgeId: string;
  judgeName: string;
  role?: "judge" | "admin";
}

export function isAdminSession(session: JudgeSession): boolean {
  return session.role === "admin" || session.judgeId === "ADMIN";
}

export function loadJudgeSession(): JudgeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(JUDGE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JudgeSession;
    if (!parsed?.judgeId?.trim()) {
      sessionStorage.removeItem(JUDGE_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(JUDGE_SESSION_KEY);
    return null;
  }
}

export function saveJudgeSession(session: JudgeSession): void {
  sessionStorage.setItem(JUDGE_SESSION_KEY, JSON.stringify(session));
}

export function clearJudgeSession(): void {
  sessionStorage.removeItem(JUDGE_SESSION_KEY);
}
