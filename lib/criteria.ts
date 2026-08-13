import type { EntryCategory, ScoringCriterion } from "@/types/review";

export const YOUTH_CRITERIA: ScoringCriterion[] = [
  { key: "imagination", label: "充滿童趣的想像力", weight: 30 },
  { key: "environment", label: "對環境的關懷", weight: 30 },
  { key: "spatial", label: "空間轉譯的潛力", weight: 40 },
];

export const PROFESSIONAL_CRITERIA: ScoringCriterion[] = [
  { key: "concept", label: "設計概念與創新", weight: 40 },
  { key: "sustainability", label: "環境永續與結構邏輯", weight: 30 },
  { key: "constructability", label: "空間與構造可行性", weight: 30 },
];

export function getCriteriaForCategory(category: EntryCategory): ScoringCriterion[] {
  const c = category.trim();
  if (c.includes("少兒")) return YOUTH_CRITERIA;
  if (c.includes("專業")) return PROFESSIONAL_CRITERIA;
  return YOUTH_CRITERIA;
}

export function defaultScores(criteria: ScoringCriterion[]): Record<string, number> {
  return Object.fromEntries(criteria.map((c) => [c.key, 7]));
}

export function defaultComments(criteria: ScoringCriterion[]): Record<string, string> {
  return Object.fromEntries(criteria.map((c) => [c.key, ""]));
}

export function weightedTotal(
  criteria: ScoringCriterion[],
  scores: Record<string, number>
): number {
  return criteria.reduce(
    (sum, c) => sum + (scores[c.key] ?? 0) * (c.weight / 100),
    0
  );
}

export function categoryLabel(category: EntryCategory): string {
  if (category.includes("少兒")) return "少兒組";
  if (category.includes("專業")) return "專業組";
  return category;
}
