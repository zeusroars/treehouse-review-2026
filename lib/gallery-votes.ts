export function formatVoteCount(
  count: number,
  locale: "zh" | "en" | "ja"
): string {
  const localeTag =
    locale === "zh" ? "zh-TW" : locale === "ja" ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(localeTag).format(count);
}

const TOP_TEN_MAX_RANK = 10;

/** Rank 1 = highest vote count; tied vote counts share the same rank. */
export function computeVoteRankMap(
  entries: { entryId: string; voteCount: number }[]
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => b.voteCount - a.voteCount);
  const ranks = new Map<string, number>();
  let rank = 0;
  let prevCount: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const { entryId, voteCount } = sorted[i];
    if (prevCount === null || voteCount !== prevCount) {
      rank = i + 1;
      prevCount = voteCount;
    }
    ranks.set(entryId, rank);
  }

  return ranks;
}

export function isTopTenByRank(rank: number | undefined): boolean {
  return rank !== undefined && rank >= 1 && rank <= TOP_TEN_MAX_RANK;
}

export function mergeVoteCounts<T extends { entryId: string }>(
  entries: T[],
  voteMap: Record<string, number>
): (T & { voteCount: number })[] {
  return entries.map((entry) => ({
    ...entry,
    voteCount: voteMap[entry.entryId] ?? 0,
  }));
}
