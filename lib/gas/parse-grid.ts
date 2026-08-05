import {
  buildPreviewFilesFromLinks,
  parseDriveLinksFromCell,
} from "@/lib/drive";
import { getDefaultEntryCategory } from "@/lib/gas/config";
import { parseDisplayRotation } from "@/lib/display-rotation";
import { getReviewStatusColumnKeys, parseReviewStatus } from "@/lib/review-status";
import type { ReviewEntryDetail } from "@/types/review";

type HeaderMap = Record<string, number>;

const ENTRY_ID_KEYS = ["報名編號", "編號", "Entry ID"];
const CATEGORY_KEYS = ["組別", "參賽組別", "組別分類"];
const TITLE_KEYS = ["作品名稱", "作品標題"];
const CONCEPT_KEYS = ["作品理念", "中英文設計理念說明", "設計理念說明", "設計理念"];
const FILE_KEYS = ["圖片雲端網址", "檔案雲端連結", "作品檔案", "檔案上傳"];
const ROTATION_KEYS = [
  "顯示旋轉",
  "旋轉角度",
  "顯示旋轉角度",
  "旋轉",
  "displayRotation",
  "Display Rotation",
  "rotation",
];
const REVIEW_STATUS_KEYS = getReviewStatusColumnKeys();

function buildHeaderMap(headerRow: string[]): HeaderMap {
  const map: HeaderMap = {};
  headerRow.forEach((h, i) => {
    const key = h.trim();
    if (key) map[key] = i;
  });
  return map;
}

function findColumn(map: HeaderMap, candidates: string[]): number | null {
  for (const key of candidates) {
    if (map[key] !== undefined) return map[key];
  }
  for (const [header, idx] of Object.entries(map)) {
    if (candidates.some((c) => header.includes(c))) return idx;
  }
  return null;
}

function cell(row: string[], col: number | null): string {
  if (col === null) return "";
  return String(row[col] ?? "").trim();
}

function isBlankRow(row: string[]): boolean {
  return row.every((c) => !String(c).trim());
}

function buildDesignConcept(
  title: string,
  concept: string,
  extraConceptCol: string
): string {
  const parts: string[] = [];
  if (title) parts.push(`【作品名稱】\n${title}`);
  if (concept) parts.push(`【作品理念】\n${concept}`);
  if (extraConceptCol && extraConceptCol !== concept) {
    parts.push(`【設計理念】\n${extraConceptCol}`);
  }
  return parts.join("\n\n");
}

/**
 * 將 GAS 回傳的 2D 陣列（第 0 列為標題）轉為匿名審查用作品清單。
 * 不回傳姓名、Email、電話等個資欄位。
 */
export function parseGasGridToEntries(grid: string[][]): ReviewEntryDetail[] {
  if (grid.length < 2) return [];

  const map = buildHeaderMap(grid[0]);
  const entryIdCol = findColumn(map, ENTRY_ID_KEYS);
  const categoryCol = findColumn(map, CATEGORY_KEYS);
  const titleCol = findColumn(map, TITLE_KEYS);
  const conceptCol = findColumn(map, CONCEPT_KEYS);
  const fileCol = findColumn(map, FILE_KEYS);
  const rotationCol = findColumn(map, ROTATION_KEYS);
  const reviewStatusCol = findColumn(map, REVIEW_STATUS_KEYS);

  const defaultCategory = getDefaultEntryCategory();
  const entries: ReviewEntryDetail[] = [];
  let sequence = 0;

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row || isBlankRow(row)) continue;

    const driveCell = fileCol !== null ? cell(row, fileCol) : "";
    const linksFromPrimary = parseDriveLinksFromCell(driveCell);
    const linksFromRow: string[] = [...linksFromPrimary];
    row.forEach((value) => {
      if (String(value).includes("drive.google.com")) {
        parseDriveLinksFromCell(String(value)).forEach((l) => {
          if (!linksFromRow.includes(l)) linksFromRow.push(l);
        });
      }
    });

    const title = cell(row, titleCol);
    const concept = cell(row, conceptCol);
    const designConcept = buildDesignConcept(title, concept, "");

    if (!designConcept && linksFromRow.length === 0) continue;

    sequence += 1;
    let entryId = entryIdCol !== null ? cell(row, entryIdCol) : "";
    if (!entryId) {
      entryId = `TH-2026-${String(sequence).padStart(4, "0")}`;
    }

    let category =
      categoryCol !== null ? cell(row, categoryCol) : defaultCategory;
    if (!category) category = defaultCategory;

    const files = buildPreviewFilesFromLinks(linksFromRow, category);
    const displayRotation = parseDisplayRotation(
      rotationCol !== null ? cell(row, rotationCol) : ""
    );
    const reviewStatus = parseReviewStatus(
      reviewStatusCol !== null ? cell(row, reviewStatusCol) : ""
    );

    entries.push({
      entryId,
      category,
      designConcept,
      workTitle: title || undefined,
      workConcept: concept || undefined,
      displayRotation: displayRotation || undefined,
      reviewStatus,
      files,
    });
  }

  return entries;
}

export function getGasGridMeta(grid: string[][]): {
  headers: string[];
  dataRowCount: number;
} {
  const headers = (grid[0] ?? []).map((h) => String(h));
  let dataRowCount = 0;
  for (let i = 1; i < grid.length; i++) {
    if (!isBlankRow(grid[i] ?? [])) dataRowCount += 1;
  }
  return { headers, dataRowCount };
}
