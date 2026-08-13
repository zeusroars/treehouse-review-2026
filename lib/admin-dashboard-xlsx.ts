import * as XLSX from "xlsx";
import { categoryLabel, getCriteriaForCategory } from "@/lib/criteria";
import type { AdminDashboardRow } from "@/types/review";

const XLSX_FILENAME = "2026_Treehouse_Review_Results.xlsx";
const OVERVIEW_SHEET_NAME = "決選總表";
const MAX_SHEET_NAME_LENGTH = 31;

function sanitizeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, "").slice(0, MAX_SHEET_NAME_LENGTH);
}

function reserveSheetName(entryId: string, usedNames: Set<string>): string {
  let base = sanitizeSheetName(entryId);
  if (!base) base = "Sheet";

  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  for (let index = 2; index < 100; index++) {
    const suffix = `_${index}`;
    const truncated = sanitizeSheetName(entryId).slice(
      0,
      MAX_SHEET_NAME_LENGTH - suffix.length
    );
    const candidate = `${truncated}${suffix}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }

  const fallback = `Entry_${usedNames.size + 1}`.slice(0, MAX_SHEET_NAME_LENGTH);
  usedNames.add(fallback);
  return fallback;
}

function selectMeetingEntries(
  rows: AdminDashboardRow[],
  topN: number
): AdminDashboardRow[] {
  const byEntryId = new Map<string, AdminDashboardRow>();

  for (const row of rows) {
    const isTop = row.scoreRank != null && row.scoreRank <= topN;
    const isDiscussion = row.needsDiscussion;
    if (isTop || isDiscussion) {
      byEntryId.set(row.entryId, row);
    }
  }

  return [...byEntryId.values()].sort((a, b) => {
    const rankA = a.scoreRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.scoreRank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return b.divergence - a.divergence;
  });
}

function buildOverviewSheet(rows: AdminDashboardRow[]): (string | number)[][] {
  const headers = [
    "作品編號",
    "組別",
    "排名",
    "評分完成數",
    "加權平均總分",
    "分歧度",
    "是否需討論",
  ];

  const scoredRows = rows
    .filter((row) => row.scoreCompleted > 0)
    .sort((a, b) => (a.scoreRank ?? Number.MAX_SAFE_INTEGER) - (b.scoreRank ?? Number.MAX_SAFE_INTEGER));

  const body = scoredRows.map((row) => [
    row.entryId,
    categoryLabel(row.category),
    row.scoreRank ?? "",
    `${row.scoreCompleted}/${row.scoreTotal}`,
    row.weightedAverage,
    row.scoreCompleted >= 2 ? row.divergence : "",
    row.needsDiscussion ? "是" : "否",
  ]);

  return [headers, ...body];
}

function buildEntryMatrix(row: AdminDashboardRow): (string | number)[][] {
  const criteria = getCriteriaForCategory(row.category);
  const judges = [...row.rawScores].sort((a, b) =>
    a.judgeId.localeCompare(b.judgeId, undefined, { numeric: true })
  );
  const judgeIds = judges.map((judge) => judge.judgeId);

  const matrix: (string | number)[][] = [["評分項目 / 評審", ...judgeIds]];

  for (const criterion of criteria) {
    matrix.push([
      `${criterion.label} (${criterion.weight}%)`,
      ...judges.map((judge) => judge.scores[criterion.key] ?? ""),
    ]);
  }

  matrix.push([
    "評審個人加權總分",
    ...judges.map((judge) => judge.weightedTotal),
  ]);

  return matrix;
}

export function downloadDashboardXlsx(
  rows: AdminDashboardRow[],
  topN = 15
): void {
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>([OVERVIEW_SHEET_NAME]);

  const overviewSheet = XLSX.utils.aoa_to_sheet(buildOverviewSheet(rows));
  XLSX.utils.book_append_sheet(workbook, overviewSheet, OVERVIEW_SHEET_NAME);

  const meetingEntries = selectMeetingEntries(rows, topN);
  for (const row of meetingEntries) {
    const sheetName = reserveSheetName(row.entryId, usedSheetNames);
    const matrixSheet = XLSX.utils.aoa_to_sheet(buildEntryMatrix(row));
    XLSX.utils.book_append_sheet(workbook, matrixSheet, sheetName);
  }

  XLSX.writeFile(workbook, XLSX_FILENAME);
}
