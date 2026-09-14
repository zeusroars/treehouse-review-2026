"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ConnectionErrorState from "@/components/ConnectionErrorState";
import EmptyEntriesState from "@/components/EmptyEntriesState";
import GalleryCard from "@/components/gallery/GalleryCard";
import GalleryImageLightbox from "@/components/gallery/GalleryImageLightbox";
import GalleryLeaderboard from "@/components/gallery/GalleryLeaderboard";
import GalleryJumpSearch from "@/components/gallery/GalleryJumpSearch";
import GalleryScrollProgress from "@/components/gallery/GalleryScrollProgress";
import GalleryVoteRulesBanner from "@/components/gallery/GalleryVoteRulesBanner";
import SiteHeader from "@/components/SiteHeader";
import { VoteProvider } from "@/contexts/VoteContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchGalleryEntries } from "@/lib/gallery-client";
import {
  computeVoteRankMap,
  isTopTenByRank,
} from "@/lib/gallery-votes";
import { fetchTranslatedTexts } from "@/lib/translate/client";
import type {
  GalleryEntryWithVotes,
  GalleryLightboxSelection,
} from "@/types/gallery";

type DisplayTextMap = Record<
  string,
  { title?: string; concept?: string }
>;

const TRANSLATE_BATCH = 5;
const PAGE_SIZE = 20;

async function buildDisplayTextMap(
  entries: GalleryEntryWithVotes[],
  locale: "en" | "ja"
): Promise<DisplayTextMap> {
  const items: {
    entryId: string;
    field: "title" | "concept";
    text: string;
  }[] = [];

  for (const entry of entries) {
    if (entry.workTitle?.trim()) {
      items.push({
        entryId: entry.entryId,
        field: "title",
        text: entry.workTitle.trim(),
      });
    }
    if (entry.workConcept?.trim()) {
      items.push({
        entryId: entry.entryId,
        field: "concept",
        text: entry.workConcept.trim(),
      });
    }
  }

  const map: DisplayTextMap = {};
  for (let i = 0; i < items.length; i += TRANSLATE_BATCH) {
    const batch = items.slice(i, i + TRANSLATE_BATCH);
    const translations = await fetchTranslatedTexts(
      batch.map((item) => item.text),
      locale
    );
    batch.forEach((item, index) => {
      const current = map[item.entryId] ?? {};
      if (item.field === "title") current.title = translations[index];
      else current.concept = translations[index];
      map[item.entryId] = current;
    });
  }

  return map;
}

interface GalleryPageClientProps {
  initialEntries?: GalleryEntryWithVotes[];
  initialLoadFailed?: boolean;
}

export default function GalleryPageClient({
  initialEntries = [],
  initialLoadFailed = false,
}: GalleryPageClientProps) {
  const { t, locale } = useLanguage();
  const [entries, setEntries] = useState<GalleryEntryWithVotes[]>(initialEntries);
  const [displayText, setDisplayText] = useState<DisplayTextMap>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(
    initialEntries.length === 0 && !initialLoadFailed
  );
  const [translating, setTranslating] = useState(false);
  const [connectionError, setConnectionError] = useState(initialLoadFailed);
  const [selectedImage, setSelectedImage] =
    useState<GalleryLightboxSelection | null>(null);

  const visibleEntries = useMemo(
    () => entries.slice(0, visibleCount),
    [entries, visibleCount]
  );

  const topThreeEntries = useMemo(
    () =>
      [...entries]
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, 3),
    [entries]
  );

  const voteRankMap = useMemo(() => computeVoteRankMap(entries), [entries]);

  const entriesToTranslate = useMemo(() => {
    const seen = new Set<string>();
    const list: GalleryEntryWithVotes[] = [];
    for (const entry of [...topThreeEntries, ...visibleEntries]) {
      if (seen.has(entry.entryId)) continue;
      seen.add(entry.entryId);
      list.push(entry);
    }
    return list;
  }, [topThreeEntries, visibleEntries]);

  const hasMore = visibleCount < entries.length;

  const loadEntries = useCallback(async (options?: { force?: boolean }) => {
    setLoading(true);
    setConnectionError(false);
    try {
      const nextEntries = await fetchGalleryEntries({ force: options?.force });
      setEntries(nextEntries);
      setVisibleCount(PAGE_SIZE);
    } catch {
      setEntries([]);
      setVisibleCount(PAGE_SIZE);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialEntries.length === 0 && !initialLoadFailed) {
      void loadEntries();
    }
  }, [initialEntries.length, initialLoadFailed, loadEntries]);

  useEffect(() => {
    if (locale === "zh" || entriesToTranslate.length === 0) {
      setDisplayText({});
      setTranslating(false);
      return;
    }

    let cancelled = false;
    setTranslating(true);

    void buildDisplayTextMap(entriesToTranslate, locale)
      .then((map) => {
        if (!cancelled) {
          setDisplayText((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayText((prev) => prev);
        }
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entriesToTranslate, locale]);

  const handleVoteCountChange = useCallback((entryId: string, voteCount: number) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.entryId === entryId ? { ...entry, voteCount } : entry
      )
    );
  }, []);

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, entries.length));
  };

  const handleOpenLightbox = useCallback((selection: GalleryLightboxSelection) => {
    setSelectedImage(selection);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const entryCountLabel = useMemo(
    () => t("gallery.entryCount", { count: entries.length }),
    [entries.length, t]
  );

  const showingLabel = useMemo(
    () =>
      t("gallery.showingCount", {
        visible: visibleEntries.length,
        total: entries.length,
      }),
    [visibleEntries.length, entries.length, t]
  );

  return (
    <VoteProvider>
    <div className="min-h-screen bg-wood-50">
      <SiteHeader
        variant="gallery"
        jumpEntries={entries}
        onExpandAll={() => setVisibleCount(entries.length)}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 lg:px-8 lg:pt-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sage-500">
            {t("preview.brandTagline")}
          </p>
          <h1 className="mt-1.5 text-xl font-light tracking-wide text-slate-800 sm:text-2xl">
            {t("gallery.title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t("gallery.subtitle")}
          </p>
          {!loading && entries.length > 0 ? (
            <p className="mt-3 text-xs text-slate-400">{showingLabel}</p>
          ) : (
            <p className="mt-3 text-xs text-slate-400">{entryCountLabel}</p>
          )}
          {translating ? (
            <p className="mt-2 text-xs text-sage-600">
              {t("gallery.translating")}
            </p>
          ) : null}
        </div>

        <GalleryVoteRulesBanner />

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            {t("gallery.loading")}
          </div>
        ) : connectionError ? (
          <ConnectionErrorState
            className="min-h-[40vh]"
            retrying={loading}
            onRetry={() => void loadEntries({ force: true })}
          />
        ) : entries.length === 0 ? (
          <EmptyEntriesState className="min-h-[40vh]" />
        ) : (
          <>
            {topThreeEntries.length > 0 ? (
              <GalleryLeaderboard
                entries={topThreeEntries}
                displayText={displayText}
              />
            ) : null}

            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {visibleEntries.map((entry) => {
                const listIndex =
                  entries.findIndex((item) => item.entryId === entry.entryId) + 1;
                return (
                  <GalleryCard
                    key={entry.entryId}
                    entry={entry}
                    listIndex={listIndex}
                    displayTitle={displayText[entry.entryId]?.title}
                    displayConcept={displayText[entry.entryId]?.concept}
                    isTopTen={isTopTenByRank(voteRankMap.get(entry.entryId))}
                    onVoteCountChange={handleVoteCountChange}
                    onImageClick={handleOpenLightbox}
                  />
                );
              })}
            </div>

            {entries.length > 0 ? (
              <div className="mt-10 flex justify-center pb-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={!hasMore}
                  aria-disabled={!hasMore}
                  className={
                    hasMore
                      ? "min-h-12 rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-sage-800 shadow-md ring-1 ring-slate-200/90 transition hover:bg-sage-50 hover:shadow-lg active:translate-y-px active:bg-sage-100 active:shadow-sm sm:text-base"
                      : "min-h-12 cursor-default rounded-2xl bg-slate-100 px-8 py-3.5 text-sm font-medium text-slate-400 shadow-none ring-1 ring-slate-200/60 sm:text-base"
                  }
                >
                  {hasMore
                    ? t("gallery.loadMore")
                    : t("gallery.loadMoreComplete")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <GalleryImageLightbox
        selection={selectedImage}
        onClose={handleCloseLightbox}
      />

      <GalleryScrollProgress
        totalCount={entries.length}
        enabled={!loading && !connectionError && entries.length > 0}
      />

      <GalleryJumpSearch
        entries={entries}
        enabled={!loading && !connectionError && entries.length > 0}
        onExpandAll={() => setVisibleCount(entries.length)}
      />
    </div>
    </VoteProvider>
  );
}
