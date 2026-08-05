import { VOTE_QUOTA_MAX } from "@/lib/vote-api";

const STORAGE_KEY = "treehouse-voter-id";
const VOTED_KEY = "treehouse-voted-entries";

function randomVoterId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `voter_${crypto.randomUUID()}`;
  }
  return `voter_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "server_anonymous";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = randomVoterId();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function getVotedEntryIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function getVotesUsedCount(): number {
  return getVotedEntryIds().size;
}

export function getRemainingVotesLocal(): number {
  return Math.max(0, VOTE_QUOTA_MAX - getVotesUsedCount());
}

export function isLocalQuotaExhausted(): boolean {
  return getVotesUsedCount() >= VOTE_QUOTA_MAX;
}

export function hasVotedForEntry(entryId: string): boolean {
  return getVotedEntryIds().has(entryId);
}

export function markEntryAsVoted(entryId: string): number {
  if (typeof window === "undefined") return 0;
  const voted = getVotedEntryIds();
  voted.add(entryId);
  localStorage.setItem(VOTED_KEY, JSON.stringify([...voted]));
  return voted.size;
}
