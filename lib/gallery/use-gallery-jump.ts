"use client";

import { useCallback, useState } from "react";
import type { GalleryEntryWithVotes } from "@/types/gallery";

const HIGHLIGHT_MS = 2000;

export const JUMP_HIGHLIGHT_CSS = `
  [data-entry-id][data-jump-highlight="1"] {
    outline: 2px solid #4a9068;
    outline-offset: 3px;
    border-radius: 1rem;
    transition: outline 0.2s;
    animation: gallery-jump-pulse 0.5s ease-out 2;
  }
  @keyframes gallery-jump-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(74,144,104,0.45); }
    70%  { box-shadow: 0 0 0 10px rgba(74,144,104,0); }
    100% { box-shadow: 0 0 0 0 rgba(74,144,104,0); }
  }
`;

function normalise(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

export function findGalleryEntry(
  entries: GalleryEntryWithVotes[],
  query: string
): GalleryEntryWithVotes | null {
  const q = normalise(query);
  if (!q) return null;

  const exact = entries.find((e) => normalise(e.entryId) === q);
  if (exact) return exact;

  const partial = entries.find((e) => normalise(e.entryId).includes(q));
  if (partial) return partial;

  const titled = entries.find(
    (e) => e.workTitle && normalise(e.workTitle).includes(q)
  );
  return titled ?? null;
}

export function scrollToGalleryEntry(entryId: string): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-entry-id="${CSS.escape(entryId)}"]`
  );
  if (!el) return false;

  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    Math.max(80, window.innerHeight * 0.15);

  window.scrollTo({ top, behavior: "smooth" });

  el.dataset.jumpHighlight = "1";
  setTimeout(() => {
    delete el.dataset.jumpHighlight;
  }, HIGHLIGHT_MS);

  return true;
}

export interface UseGalleryJumpOptions {
  entries: GalleryEntryWithVotes[];
  onExpandAll?: () => void;
  onSuccess?: () => void;
}

export interface UseGalleryJumpReturn {
  query: string;
  setQuery: (q: string) => void;
  errorMsg: string | null;
  clearError: () => void;
  jump: (q?: string) => void;
  canJump: boolean;
}

/**
 * Shared jump logic used by both the FAB overlay and the header inline search.
 * Caller must supply t() strings because hook lives outside React context.
 */
export function useGalleryJump(
  options: UseGalleryJumpOptions,
  msgs: { notFound: (q: string) => string; notVisible: (id: string) => string }
): UseGalleryJumpReturn {
  const { entries, onExpandAll, onSuccess } = options;
  const [query, setQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const jump = useCallback(
    (overrideQuery?: string) => {
      const q = overrideQuery ?? query;
      setErrorMsg(null);

      const match = findGalleryEntry(entries, q);
      if (!match) {
        setErrorMsg(msgs.notFound(q));
        return;
      }

      const found = scrollToGalleryEntry(match.entryId);
      if (found) {
        onSuccess?.();
        return;
      }

      if (onExpandAll) {
        onExpandAll();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const retried = scrollToGalleryEntry(match.entryId);
            if (retried) {
              onSuccess?.();
            } else {
              setErrorMsg(msgs.notVisible(match.entryId));
            }
          });
        });
      } else {
        setErrorMsg(msgs.notVisible(match.entryId));
      }
    },
    [entries, query, onExpandAll, onSuccess, msgs]
  );

  return {
    query,
    setQuery: (q) => {
      setQuery(q);
      setErrorMsg(null);
    },
    errorMsg,
    clearError: () => setErrorMsg(null),
    jump,
    canJump: query.trim().length > 0,
  };
}
