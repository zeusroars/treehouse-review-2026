"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GalleryEntryWithVotes } from "@/types/gallery";

const HIGHLIGHT_MS = 2000;

interface GalleryJumpSearchProps {
  entries: GalleryEntryWithVotes[];
  enabled?: boolean;
}

function normalise(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

function findEntry(
  entries: GalleryEntryWithVotes[],
  query: string
): GalleryEntryWithVotes | null {
  const q = normalise(query);
  if (!q) return null;

  // 1. Exact entryId match (case-insensitive, spaces stripped)
  const exact = entries.find((e) => normalise(e.entryId) === q);
  if (exact) return exact;

  // 2. Partial entryId match (e.g. "0011" matches "TH-2026-0011")
  const partial = entries.find((e) => normalise(e.entryId).includes(q));
  if (partial) return partial;

  // 3. Work title keyword match
  const titled = entries.find(
    (e) => e.workTitle && normalise(e.workTitle).includes(q)
  );
  if (titled) return titled;

  return null;
}

function scrollToEntry(entryId: string): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-entry-id="${CSS.escape(entryId)}"]`
  );
  if (!el) return false;

  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    Math.max(80, window.innerHeight * 0.15);

  window.scrollTo({ top, behavior: "smooth" });

  // Highlight flash
  el.dataset.jumpHighlight = "1";
  setTimeout(() => {
    delete el.dataset.jumpHighlight;
  }, HIGHLIGHT_MS);

  return true;
}

export default function GalleryJumpSearch({
  entries,
  enabled = true,
}: GalleryJumpSearchProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
      setErrorMsg(null);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      setErrorMsg(null);

      const match = findEntry(entries, query);
      if (!match) {
        setErrorMsg(t("gallery.jumpNotFound", { query }));
        return;
      }

      const found = scrollToEntry(match.entryId);
      if (!found) {
        // Entry exists in data but not yet rendered (load more needed)
        setErrorMsg(t("gallery.jumpNotVisible", { entryId: match.entryId }));
        return;
      }

      setOpen(false);
    },
    [entries, query, t]
  );

  const handleInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Inject highlight style once */}
      <style>{`
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
      `}</style>

      {/* Collapsed: FAB button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("gallery.jumpOpen")}
          className="fixed bottom-8 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-md transition hover:bg-white hover:ring-sage-300 sm:right-8"
        >
          <Search className="h-4.5 w-4.5 text-slate-600" />
        </button>
      )}

      {/* Expanded: input panel */}
      {open && (
        <div className="fixed bottom-8 right-5 z-50 w-[min(88vw,22rem)] rounded-2xl bg-white/85 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md sm:right-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-center gap-2 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-sage-600" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={handleInputKey}
                placeholder={t("gallery.jumpPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("gallery.jumpClose")}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {errorMsg && (
              <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-red-500">
                {errorMsg}
              </p>
            )}

            <div className="border-t border-slate-100 px-4 py-3">
              <button
                type="submit"
                disabled={!query.trim()}
                className="w-full rounded-xl bg-sage-600 py-2 text-xs font-medium text-white transition hover:bg-sage-700 disabled:opacity-40"
              >
                {t("gallery.jumpGo")}
              </button>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                {t("gallery.jumpHint")}
              </p>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
