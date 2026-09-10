import { VOTE_QUOTA_MAX } from "@/lib/vote-api";

const VOTED_KEY_PREFIX = "treehouse-voted-entries";

function votedStorageKey(voterId: string): string {
  return `${VOTED_KEY_PREFIX}:${voterId}`;
}

export function getVotedEntryIds(voterId?: string | null): Set<string> {
  if (typeof window === "undefined" || !voterId) return new Set();
  try {
    const raw = localStorage.getItem(votedStorageKey(voterId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function getVotesUsedCount(voterId?: string | null): number {
  return getVotedEntryIds(voterId).size;
}

export function getRemainingVotesLocal(voterId?: string | null): number {
  return Math.max(0, VOTE_QUOTA_MAX - getVotesUsedCount(voterId));
}

export function isLocalQuotaExhausted(voterId?: string | null): boolean {
  return getVotesUsedCount(voterId) >= VOTE_QUOTA_MAX;
}

export function hasVotedForEntry(entryId: string, voterId?: string | null): boolean {
  return getVotedEntryIds(voterId).has(entryId);
}

export function markEntryAsVoted(entryId: string, voterId?: string | null): number {
  if (typeof window === "undefined" || !voterId) return 0;
  const voted = getVotedEntryIds(voterId);
  voted.add(entryId);
  localStorage.setItem(votedStorageKey(voterId), JSON.stringify([...voted]));
  return voted.size;
}
