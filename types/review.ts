export type EntryCategory = "少兒組" | "專業組" | string;

export type ReviewStatus = "待審核" | "通過" | "資料不全" | string;

/** Sheet value that allows an entry to appear in the judge review panel. */
export const JUDGE_VISIBLE_REVIEW_STATUS = "通過" as const;

export function isJudgeVisibleReviewStatus(
  status: ReviewStatus | undefined
): boolean {
  if (!status) return false;
  const normalized = String(status).trim().replace(/\s/g, "");
  return normalized === "通過" || normalized.includes("通過");
}

export type PreviewFileType = "image" | "pdf";

export interface PreviewFile {
  fileId: string;
  type: PreviewFileType;
  /** Google Drive embed / view URL for iframe or img */
  previewUrl: string;
  name?: string;
}

export interface ReviewEntrySummary {
  entryId: string;
  category: EntryCategory;
  /** Whether this judge has already submitted a score */
  reviewed: boolean;
  /** Admin only: how many judges have scored this entry */
  scoreCount?: number;
  /** First file preview for gallery strip (images only) */
  thumbnailUrl?: string | null;
  thumbnailType?: PreviewFileType | null;
  /** Clockwise display rotation from sheet: 90 | 180 | 270 */
  displayRotation?: number;
  /** Preliminary review status from sheet */
  reviewStatus?: ReviewStatus;
}

export interface ReviewEntryDetail {
  entryId: string;
  category: EntryCategory;
  /** @deprecated Prefer workTitle + workConcept; kept for legacy string payloads */
  designConcept: string;
  workTitle?: string;
  workConcept?: string;
  workConceptExtra?: string;
  /** Clockwise display rotation from sheet: 90 | 180 | 270 */
  displayRotation?: number;
  /** Preliminary review status from sheet */
  reviewStatus?: ReviewStatus;
  files: PreviewFile[];
}

export interface ReviewProgress {
  currentIndex: number;
  total: number;
  reviewedCount: number;
}

export interface EntriesListResponse {
  ok: boolean;
  error?: string;
  entries?: ReviewEntrySummary[];
  progress?: { reviewedCount: number; total: number };
}

export interface EntryDetailResponse {
  ok: boolean;
  error?: string;
  entry?: ReviewEntryDetail;
}

export interface SubmitScorePayload {
  judgeId: string;
  entryId: string;
  category: EntryCategory;
  scores: Record<string, number>;
  comments: Record<string, string>;
}

export interface SubmitScoreResponse {
  ok: boolean;
  error?: string;
  nextEntryId?: string | null;
}

export interface ValidateJudgeResponse {
  ok: boolean;
  error?: string;
  judgeId?: string;
  judgeName?: string;
  role?: "judge" | "admin";
}

export type CriteriaKey = string;

export interface ScoringCriterion {
  key: CriteriaKey;
  label: string;
  weight: number;
}
