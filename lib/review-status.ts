import type { ReviewStatus } from "@/types/review";

const REVIEW_STATUS_KEYS = [
  "審核狀態",
  "審查狀態",
  "reviewStatus",
  "Review Status",
];

export function getReviewStatusColumnKeys(): string[] {
  return REVIEW_STATUS_KEYS;
}

const KNOWN_STATUSES = new Set<ReviewStatus>(["待審核", "通過", "資料不全"]);

export function parseReviewStatus(raw: string | undefined | null): ReviewStatus {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "待審核";
  if (KNOWN_STATUSES.has(trimmed)) return trimmed;
  return trimmed;
}
