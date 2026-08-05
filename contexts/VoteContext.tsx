"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { VOTE_QUOTA_MAX } from "@/lib/vote-api";
import {
  getRemainingVotesLocal,
  getVotesUsedCount,
  getVotedEntryIds,
  isLocalQuotaExhausted,
  markEntryAsVoted,
} from "@/lib/voter-id";

const EMPTY_VOTED_IDS = new Set<string>();

const SSR_VOTE_SNAPSHOT = {
  votesUsed: 0,
  remainingVotes: VOTE_QUOTA_MAX,
  quotaExhausted: false,
  votedEntryIds: EMPTY_VOTED_IDS,
};

interface VoteContextValue {
  /** True after client mount + localStorage has been read (safe for vote UI). */
  isHydrated: boolean;
  votesUsed: number;
  remainingVotes: number;
  quotaExhausted: boolean;
  votedEntryIds: Set<string>;
  refreshVoteState: () => void;
  recordVoteSuccess: (entryId: string, remainingFromServer?: number) => void;
  markQuotaExhausted: () => void;
}

const VoteContext = createContext<VoteContextValue | null>(null);

function readVoteState(quotaForced: boolean) {
  const votesUsed = getVotesUsedCount();
  const remainingVotes = getRemainingVotesLocal();
  const quotaExhausted =
    quotaForced || isLocalQuotaExhausted() || remainingVotes <= 0;
  return {
    votesUsed,
    remainingVotes,
    quotaExhausted,
    votedEntryIds: getVotedEntryIds(),
  };
}

export function VoteProvider({ children }: { children: ReactNode }) {
  const [quotaForced, setQuotaForced] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [snapshot, setSnapshot] = useState(SSR_VOTE_SNAPSHOT);

  const refreshVoteState = useCallback(() => {
    setSnapshot(readVoteState(quotaForced));
  }, [quotaForced]);

  useEffect(() => {
    setSnapshot(readVoteState(false));
    setIsHydrated(true);
  }, []);

  const recordVoteSuccess = useCallback(
    (entryId: string, remainingFromServer?: number) => {
      markEntryAsVoted(entryId);
      if (remainingFromServer !== undefined) {
        const exhausted = remainingFromServer <= 0;
        setQuotaForced(exhausted);
        setSnapshot({
          votesUsed: Math.max(0, VOTE_QUOTA_MAX - remainingFromServer),
          remainingVotes: Math.max(0, remainingFromServer),
          quotaExhausted: exhausted,
          votedEntryIds: getVotedEntryIds(),
        });
        return;
      }
      setSnapshot(readVoteState(quotaForced));
    },
    [quotaForced]
  );

  const markQuotaExhausted = useCallback(() => {
    setQuotaForced(true);
    setSnapshot(readVoteState(true));
  }, []);

  const value = useMemo<VoteContextValue>(
    () => ({
      isHydrated,
      votesUsed: snapshot.votesUsed,
      remainingVotes: snapshot.remainingVotes,
      quotaExhausted: snapshot.quotaExhausted,
      votedEntryIds: snapshot.votedEntryIds,
      refreshVoteState,
      recordVoteSuccess,
      markQuotaExhausted,
    }),
    [isHydrated, snapshot, refreshVoteState, recordVoteSuccess, markQuotaExhausted]
  );

  return <VoteContext.Provider value={value}>{children}</VoteContext.Provider>;
}

export function useVoteQuota(): VoteContextValue {
  const ctx = useContext(VoteContext);
  if (!ctx) {
    throw new Error("useVoteQuota must be used within VoteProvider");
  }
  return ctx;
}
