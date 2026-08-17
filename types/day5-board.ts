export type Day5ColumnId = "pool" | "top4" | "honorable" | "eliminated";

export interface Day5BoardEntry {
  entryId: string;
  workTitle?: string;
  imageUrl: string | null;
  displayRotation?: number;
  /** Mock Day 4 star count (0–5). */
  starCount: number;
}

export interface Day5BoardResponse {
  ok: boolean;
  error?: string;
  entries?: Day5BoardEntry[];
}

export const DAY5_COLUMN_LIMITS: Record<
  Day5ColumnId,
  { max: number | null; emoji: string }
> = {
  pool: { max: null, emoji: "" },
  top4: { max: 4, emoji: "🏆" },
  honorable: { max: 10, emoji: "🏅" },
  eliminated: { max: 2, emoji: "❌" },
};

export type Day5ColumnState = Record<Day5ColumnId, string[]>;

export function emptyDay5Columns(): Day5ColumnState {
  return { pool: [], top4: [], honorable: [], eliminated: [] };
}
