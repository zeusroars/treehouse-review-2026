/** Deterministic mock star count (0–5) when no Day 4 shortlist data exists. */
export function mockStarCount(entryId: string): number {
  let hash = 0;
  for (let i = 0; i < entryId.length; i += 1) {
    hash = (hash + entryId.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash % 6;
}

export function resolveStarCount(entryId: string, shortlistedBy: string[]): number {
  if (shortlistedBy.length > 0) {
    return Math.min(5, shortlistedBy.length);
  }
  return mockStarCount(entryId);
}
