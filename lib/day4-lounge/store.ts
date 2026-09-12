import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { buildAdminDashboardRows } from "@/lib/admin-dashboard";
import {
  DAY4_LIST_THUMB_WIDTH,
  DAY4_PINUP_WIDTH,
  buildDriveThumbnailProxyUrl,
} from "@/lib/drive-thumbnail";
import { loadAllEntriesFromGas } from "@/lib/gas/entries-cache";
import { getJudgeDisplayName, listJudgeIds } from "@/lib/judges";
import type {
  Day4LoungeAction,
  Day4LoungeEntry,
  Day4Language,
  Day4Note,
} from "@/types/day4-lounge";

const STORE_PATH = path.join(process.cwd(), "data", "day4-lounge.json");
const FINALIST_COUNT = 16;
const MAX_NOTE_LENGTH = 600;
const MAX_REPLY_LENGTH = 400;

interface StoredNote {
  content: string;
  language?: Day4Language;
  updatedAt: string;
  likedBy: string[];
  replies: Day4Note["replies"];
}

type LoungeStore = Record<string, Record<string, StoredNote>>;
type ShortlistStore = Record<string, string[]>;

interface PersistedLoungeData {
  notes: LoungeStore;
  shortlists: ShortlistStore;
}

let writeQueue: Promise<unknown> = Promise.resolve();

function isWrappedStore(value: unknown): value is PersistedLoungeData {
  return (
    typeof value === "object" &&
    value !== null &&
    "notes" in value &&
    typeof (value as PersistedLoungeData).notes === "object"
  );
}

function shortlistedByForEntry(
  shortlists: ShortlistStore,
  entryId: string
): string[] {
  return Object.entries(shortlists)
    .filter(([, entryIds]) => entryIds.includes(entryId))
    .map(([judgeId]) => judgeId);
}

function emptyNote(judgeId: string): Day4Note {
  return {
    judgeId,
    judgeName: getJudgeDisplayName(judgeId),
    content: "",
    language: null,
    updatedAt: null,
    likedBy: [],
    replies: [],
  };
}

async function readPersisted(): Promise<PersistedLoungeData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    if (!raw.trim()) return { notes: {}, shortlists: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (isWrappedStore(parsed)) {
      return {
        notes: parsed.notes ?? {},
        shortlists: parsed.shortlists ?? {},
      };
    }
    return { notes: parsed as LoungeStore, shortlists: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { notes: {}, shortlists: {} };
    }
    return { notes: {}, shortlists: {} };
  }
}

async function writePersisted(data: PersistedLoungeData): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

function notesForEntry(store: LoungeStore, entryId: string): Day4Note[] {
  const stored = store[entryId] ?? {};
  return listJudgeIds().map((judgeId) => {
    const note = stored[judgeId];
    if (!note) return emptyNote(judgeId);
    return {
      judgeId,
      judgeName: getJudgeDisplayName(judgeId),
      content: note.content,
      language: note.language ?? "zh",
      updatedAt: note.updatedAt,
      likedBy: note.likedBy ?? [],
      replies: (note.replies ?? []).map((reply) => ({
        ...reply,
        language: reply.language ?? "zh",
      })),
    };
  });
}

export async function listDay4LoungeEntries(): Promise<Day4LoungeEntry[]> {
  const [rows, persisted, entryDetails] = await Promise.all([
    buildAdminDashboardRows(),
    readPersisted(),
    loadAllEntriesFromGas(),
  ]);
  const { notes: store, shortlists } = persisted;
  const detailsById = new Map(entryDetails.map((entry) => [entry.entryId, entry]));
  const finalists = [...rows]
    .sort((a, b) => {
      if (a.scoreRank == null && b.scoreRank == null) {
        return a.entryId.localeCompare(b.entryId);
      }
      if (a.scoreRank == null) return 1;
      if (b.scoreRank == null) return -1;
      return a.scoreRank - b.scoreRank;
    })
    .slice(0, FINALIST_COUNT);

  return finalists.map((row) => {
    const notes = notesForEntry(store, row.entryId);
    const detail = detailsById.get(row.entryId);
    const firstFile = detail?.files[0];
    const workConcept = [
      detail?.workConcept ?? detail?.designConcept,
      detail?.workConceptExtra,
    ]
      .filter(Boolean)
      .join("\n\n");
    return {
      entryId: row.entryId,
      workTitle: detail?.workTitle ?? row.workTitle,
      workConcept,
      category: row.category,
      thumbnailUrl: firstFile
        ? buildDriveThumbnailProxyUrl(firstFile.fileId, DAY4_LIST_THUMB_WIDTH)
        : row.thumbnailUrl,
      imageUrl: firstFile
        ? buildDriveThumbnailProxyUrl(firstFile.fileId, DAY4_PINUP_WIDTH)
        : row.thumbnailUrl,
      displayRotation: row.displayRotation,
      scoreRank: row.scoreRank,
      technicalAssessment:
        "請共同確認結構安全、材料耐候性、施工可行性與基地環境影響；最終結論由大會技術團隊彙整。",
      discussionCount: notes.reduce(
        (sum, note) => sum + (note.content ? 1 : 0) + note.replies.length,
        0
      ),
      notes,
      shortlistedBy: shortlistedByForEntry(shortlists, row.entryId),
    };
  });
}

function requireJudge(judgeId: string): void {
  if (!listJudgeIds().includes(judgeId)) {
    throw new Error("無效的評審身分");
  }
}

function normalizeContent(content: string, max: number): string {
  const value = content.trim();
  if (!value) throw new Error("內容不可為空");
  if (value.length > max) throw new Error(`內容不可超過 ${max} 字`);
  return value;
}

function requireLanguage(language: Day4Language): void {
  if (!["zh", "en", "ja"].includes(language)) {
    throw new Error("無效的留言語言");
  }
}

export async function mutateDay4Lounge(
  payload: Day4LoungeAction
): Promise<Day4LoungeEntry[]> {
  requireJudge(payload.judgeId);

  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const persisted = await readPersisted();
    const store = persisted.notes;
    const shortlists = persisted.shortlists;
    const entry = (store[payload.entryId] ??= {});
    const now = new Date().toISOString();

    if (payload.action === "save_note") {
      requireLanguage(payload.language);
      const content = normalizeContent(payload.content, MAX_NOTE_LENGTH);
      const current = entry[payload.judgeId];
      entry[payload.judgeId] = {
        content,
        language: payload.language,
        updatedAt: now,
        likedBy: current?.likedBy ?? [],
        replies: current?.replies ?? [],
      };
    }

    if (payload.action === "toggle_like") {
      if (payload.noteJudgeId === payload.judgeId) {
        throw new Error("不能為自己的便利貼按讚");
      }
      requireJudge(payload.noteJudgeId);
      const target = entry[payload.noteJudgeId];
      if (!target?.content) throw new Error("尚無可按讚的點評");
      const liked = new Set(target.likedBy ?? []);
      if (liked.has(payload.judgeId)) liked.delete(payload.judgeId);
      else liked.add(payload.judgeId);
      target.likedBy = [...liked];
    }

    if (payload.action === "add_reply") {
      requireLanguage(payload.language);
      requireJudge(payload.noteJudgeId);
      const target = entry[payload.noteJudgeId];
      if (!target?.content) throw new Error("請先建立主點評");
      target.replies.push({
        id: randomUUID(),
        judgeId: payload.judgeId,
        judgeName: getJudgeDisplayName(payload.judgeId),
        content: normalizeContent(payload.content, MAX_REPLY_LENGTH),
        language: payload.language,
        createdAt: now,
      });
    }

    if (payload.action === "toggle_shortlist") {
      const current = new Set(shortlists[payload.judgeId] ?? []);
      if (current.has(payload.entryId)) current.delete(payload.entryId);
      else current.add(payload.entryId);
      shortlists[payload.judgeId] = [...current];
    }

    await writePersisted({ notes: store, shortlists });
  });

  await writeQueue;
  return listDay4LoungeEntries();
}
