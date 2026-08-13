import fs from "fs/promises";
import path from "path";
import type { SubmitScorePayload } from "@/types/review";

const SCORES_PATH = path.join(process.cwd(), "data", "review-scores.jsonl");

export interface StoredScore extends SubmitScorePayload {
  timestamp: string;
}

async function ensureDataDir() {
  await fs.mkdir(path.dirname(SCORES_PATH), { recursive: true });
}

export async function appendScore(payload: SubmitScorePayload): Promise<void> {
  await ensureDataDir();
  const line: StoredScore = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  await fs.appendFile(SCORES_PATH, `${JSON.stringify(line)}\n`, "utf8");
}

export async function getReviewedEntryIdsForJudge(
  judgeId: string
): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(SCORES_PATH, "utf8");
    const set = new Set<string>();
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as StoredScore;
      if (row.judgeId === judgeId) set.add(row.entryId);
    }
    return set;
  } catch {
    return new Set();
  }
}

export async function readAllScores(): Promise<StoredScore[]> {
  try {
    const raw = await fs.readFile(SCORES_PATH, "utf8");
    const rows: StoredScore[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      rows.push(JSON.parse(line) as StoredScore);
    }
    return rows;
  } catch {
    return [];
  }
}

export async function clearAllScores(): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SCORES_PATH, "", "utf8");
}

export async function writeAllScores(scores: StoredScore[]): Promise<void> {
  await ensureDataDir();
  const content = scores.map((row) => JSON.stringify(row)).join("\n");
  await fs.writeFile(
    SCORES_PATH,
    content.length > 0 ? `${content}\n` : "",
    "utf8"
  );
}

export async function getScoreCountByEntry(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(SCORES_PATH, "utf8");
    const counts: Record<string, number> = {};
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as StoredScore;
      if (row.judgeId === "ADMIN") continue;
      counts[row.entryId] = (counts[row.entryId] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function findNextPendingEntryId(
  judgeId: string,
  entryIds: string[],
  currentEntryId: string
): Promise<string | null> {
  const reviewed = await getReviewedEntryIdsForJudge(judgeId);
  const idx = entryIds.indexOf(currentEntryId);
  if (idx >= 0) {
    for (let i = idx + 1; i < entryIds.length; i++) {
      if (!reviewed.has(entryIds[i])) return entryIds[i];
    }
  }
  return entryIds.find((id) => !reviewed.has(id)) ?? null;
}
