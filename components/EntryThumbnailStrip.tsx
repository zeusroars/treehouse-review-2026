"use client";

import { useEffect, useRef } from "react";
import { Check, FileText } from "lucide-react";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ReviewEntrySummary } from "@/types/review";

const THUMB_CLASS = "h-[6.5rem] w-[6.5rem]";

interface EntryThumbnailStripProps {
  entries: ReviewEntrySummary[];
  activeEntryId: string;
  onSelectEntry: (entryId: string) => void;
  loading?: boolean;
  isAdmin?: boolean;
}

export default function EntryThumbnailStrip({
  entries,
  activeEntryId,
  onSelectEntry,
  loading = false,
  isAdmin = false,
}: EntryThumbnailStripProps) {
  const { t } = useLanguage();
  const activeRef = useRef<HTMLButtonElement>(null);
  const activeIndex = entries.findIndex((e) => e.entryId === activeEntryId);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeEntryId, entries.length]);

  return (
    <aside
      className="relative z-20 flex min-h-0 max-h-[38vh] shrink-0 flex-col border-b border-white/10 bg-slate-950/90 lg:h-full lg:max-h-none lg:w-[9.25rem] lg:border-b-0 lg:border-r"
      aria-label={t("thumbnail.allEntries")}
    >
      <div className="shrink-0 border-b border-white/10 px-2 py-2">
        <p className="text-center text-[10px] font-medium uppercase tracking-wider text-white/45">
          {t("thumbnail.allEntries")}
        </p>
        {entries.length > 0 ? (
          <p className="mt-0.5 text-center text-[10px] text-sage-300/80">
            {activeIndex >= 0 ? activeIndex + 1 : "—"} / {entries.length}
          </p>
        ) : null}
      </div>

      {loading && entries.length === 0 ? (
        <p className="px-3 py-4 text-[10px] text-white/40 lg:px-2 lg:text-center">
          {t("thumbnail.loading")}
        </p>
      ) : entries.length === 0 ? (
        <p className="px-3 py-4 text-[10px] leading-snug text-white/40 lg:px-2 lg:text-center">
          {t("thumbnail.noEntries")}
        </p>
      ) : (
        <div className="thumb-strip-scroll flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden p-3 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:p-2">
          {entries.map((entry, index) => {
            const isActive = entry.entryId === activeEntryId;
            const showImage =
              entry.thumbnailType === "image" && Boolean(entry.thumbnailUrl);

            return (
              <button
                key={entry.entryId}
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => onSelectEntry(entry.entryId)}
                className={`group relative shrink-0 overflow-hidden rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${THUMB_CLASS} ${
                  isActive
                    ? "ring-2 ring-sage-400 shadow-md shadow-sage-900/30"
                    : "ring-1 ring-white/15 opacity-75 hover:opacity-100 hover:ring-white/30"
                } ${entry.reviewed && !isAdmin ? "opacity-50" : ""}`}
                aria-label={t("thumbnail.selectEntry", { entryId: entry.entryId })}
                aria-current={isActive ? "true" : undefined}
              >
                {showImage ? (
                  <RotatedContainImage
                    src={entry.thumbnailUrl!}
                    alt=""
                    rotation={entry.displayRotation}
                    layout="fill"
                    className="bg-slate-900"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-800 px-1 text-white/70">
                    <FileText className="h-6 w-6 shrink-0" />
                    <span className="max-w-full truncate font-mono text-[8px]">
                      {entry.entryId.replace("TH-2026-", "")}
                    </span>
                  </div>
                )}

                <span
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent py-1 text-center font-mono text-[9px] font-medium tracking-wide text-white/95 ${
                    isActive ? "from-sage-900/90" : ""
                  }`}
                >
                  {index + 1}
                </span>

                {entry.reviewed && !isAdmin ? (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage-600/90 text-white shadow">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}

                {isAdmin && entry.scoreCount != null && entry.scoreCount > 0 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-semibold text-slate-900">
                    {entry.scoreCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
