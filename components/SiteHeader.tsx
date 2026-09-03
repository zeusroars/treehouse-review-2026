"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useRef, type FormEvent, type KeyboardEvent } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GalleryEntryWithVotes } from "@/types/gallery";
import {
  JUMP_HIGHLIGHT_CSS,
  useGalleryJump,
} from "@/lib/gallery/use-gallery-jump";

interface SiteHeaderProps {
  variant?: "gallery" | "judge";
  /** When provided, shows the inline desktop search bar */
  jumpEntries?: GalleryEntryWithVotes[];
  onExpandAll?: () => void;
}

function HeaderInlineSearch({
  entries,
  onExpandAll,
}: {
  entries: GalleryEntryWithVotes[];
  onExpandAll?: () => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, errorMsg, jump, canJump } = useGalleryJump(
    {
      entries,
      onExpandAll,
      onSuccess: () => {
        setQuery("");
        inputRef.current?.blur();
      },
    },
    {
      notFound: (q) => t("gallery.jumpNotFound", { query: q }),
      notVisible: (id) => t("gallery.jumpNotVisible", { entryId: id }),
    }
  );

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    jump();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jump();
    }
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative hidden lg:flex"
    >
      <div
        className={`flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 ring-1 transition-all ${
          errorMsg
            ? "ring-red-300"
            : "ring-slate-200/70 focus-within:ring-sage-400/70"
        }`}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-sage-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t("gallery.jumpPlaceholder")}
          className="w-40 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:w-56 focus:outline-none transition-[width] duration-200"
          autoComplete="off"
          spellCheck={false}
        />
        {canJump && (
          <button
            type="submit"
            className="shrink-0 rounded-full bg-sage-600 px-2 py-0.5 text-[10px] font-medium text-white transition hover:bg-sage-700"
          >
            {t("gallery.jumpGo")}
          </button>
        )}
      </div>
      {errorMsg && (
        <p className="absolute left-0 top-full mt-1.5 w-64 rounded-lg bg-white px-3 py-2 text-[11px] text-red-500 shadow-lg ring-1 ring-slate-100">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

export default function SiteHeader({
  variant = "gallery",
  jumpEntries,
  onExpandAll,
}: SiteHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const onGallery = pathname === "/";
  const onJudge = pathname.startsWith("/judge");

  const showSearch = onGallery && !!jumpEntries?.length;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-wood-50/90 backdrop-blur-md">
      {showSearch && <style>{JUMP_HIGHLIGHT_CSS}</style>}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sage-500">
            {t("preview.brandTagline")}
          </p>
          <h1 className="truncate text-lg font-light tracking-wide text-slate-800 lg:text-xl">
            {variant === "judge" ? t("judge.pageTitle") : t("gallery.title")}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          {/* Desktop inline search — only on gallery page */}
          {showSearch && (
            <HeaderInlineSearch
              entries={jumpEntries!}
              onExpandAll={onExpandAll}
            />
          )}

          <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-slate-200/70">
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                onGallery
                  ? "bg-sage-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("gallery.navGallery")}
            </Link>
            <Link
              href="/judge"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                onJudge
                  ? "bg-sage-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("gallery.navJudge")}
            </Link>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
