"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GalleryEntryWithVotes } from "@/types/gallery";
import {
  JUMP_HIGHLIGHT_CSS,
  useGalleryJump,
} from "@/lib/gallery/use-gallery-jump";

interface GalleryJumpSearchProps {
  entries: GalleryEntryWithVotes[];
  enabled?: boolean;
  onExpandAll?: () => void;
}

export default function GalleryJumpSearch({
  entries,
  enabled = true,
  onExpandAll,
}: GalleryJumpSearchProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, errorMsg, jump } = useGalleryJump(
    {
      entries,
      onExpandAll,
      onSuccess: () => setOpen(false),
    },
    {
      notFound: (q) => t("gallery.jumpNotFound", { query: q }),
      notVisible: (id) => t("gallery.jumpNotVisible", { entryId: id }),
    }
  );

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery("");
    }
  }, [open, setQuery]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    jump();
  };

  const handleInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jump();
    }
  };

  // On desktop the header inline search handles it — hide FAB there
  if (!enabled) return null;

  return (
    <>
      <style>{JUMP_HIGHLIGHT_CSS}</style>

      {/* FAB — visible on mobile/tablet only (desktop uses header search) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("gallery.jumpOpen")}
          className="fixed bottom-8 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-md transition hover:bg-white hover:ring-sage-300 sm:right-8 lg:hidden"
        >
          <Search className="h-4.5 w-4.5 text-slate-600" />
        </button>
      )}

      {/* Expanded panel — visible on mobile/tablet only */}
      {open && (
        <div className="fixed bottom-8 right-5 z-50 w-[min(88vw,22rem)] rounded-2xl bg-white/85 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md sm:right-8 lg:hidden">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex items-center gap-2 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-sage-600" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
