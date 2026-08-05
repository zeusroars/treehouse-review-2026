/** Maximum votes per voter (matches GAS backend limit). */
export const VOTE_QUOTA_MAX = 10;

export interface ParsedVoteApiResponse {
  ok: boolean;
  status: "success" | "error" | string;
  message: string;
  remainingVotes?: number;
}

export function parseVoteApiResponse(data: unknown): ParsedVoteApiResponse {
  if (!data || typeof data !== "object") {
    return {
      ok: false,
      status: "error",
      message: "無效的回應格式",
    };
  }

  const obj = data as Record<string, unknown>;
  const status = String(obj.status ?? (obj.ok === true ? "success" : "")).toLowerCase();
  const message = String(
    obj.message ?? obj.error ?? (status === "success" ? "投票成功" : "投票失敗")
  );

  const remainingRaw =
    obj.remainingVotes ?? obj.remaining ?? obj.votesLeft ?? obj.votesRemaining;
  const remainingParsed = Number(remainingRaw);
  const remainingVotes = Number.isFinite(remainingParsed)
    ? Math.max(0, Math.floor(remainingParsed))
    : undefined;

  if (status === "error") {
    return { ok: false, status: "error", message, remainingVotes };
  }

  if (status === "success" || obj.ok === true) {
    return { ok: true, status: "success", message, remainingVotes };
  }

  return { ok: false, status: status || "error", message, remainingVotes };
}

export function isQuotaExhaustedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("10") ||
    lower.includes("用盡") ||
    lower.includes("額度") ||
    lower.includes("上限") ||
    lower.includes("limit") ||
    lower.includes("exhausted") ||
    lower.includes("quota")
  );
}

/** Detects GAS "already voted for this entry" style error messages. */
export function isDuplicateVoteMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("重複") ||
    lower.includes("已投票") ||
    lower.includes("已投過") ||
    lower.includes("duplicate") ||
    lower.includes("already voted")
  );
}
