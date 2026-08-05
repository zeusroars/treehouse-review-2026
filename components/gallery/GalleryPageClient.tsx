"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GalleryCard from "@/components/gallery/GalleryCard";
import GalleryLeaderboard from "@/components/gallery/GalleryLeaderboard";
import SiteHeader from "@/components/SiteHeader";
import { VoteProvider } from "@/contexts/VoteContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  computeVoteRankMap,
  isTopTenByRank,
} from "@/lib/gallery-votes";
import { fetchTranslatedTexts } from "@/lib/translate/client";
import type { GalleryEntriesResponse, GalleryEntryWithVotes } from "@/types/gallery";

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
  initialError?: string | null;
}

export default function GalleryPageClient({
  initialEntries = [],
  initialError = null,
}: GalleryPageClientProps) {
  const { t, locale } = useLanguage();
  const [entries, setEntries] = useState<GalleryEntryWithVotes[]>(initialEntries);
  const [displayText, setDisplayText] = useState<DisplayTextMap>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(initialEntries.length === 0 && !initialError);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

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

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/entries");
      const data = (await res.json()) as GalleryEntriesResponse;
      if (!res.ok || !data.ok || !data.entries) {
        throw new Error(data.error ?? t("gallery.loadFailed"));
      }
      setEntries(
        data.entries.map((e) => ({
          ...e,
          voteCount: e.voteCount ?? 0,
        }))
      );
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setEntries([]);
      setVisibleCount(PAGE_SIZE);
      setError(err instanceof Error ? err.message : t("gallery.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (initialEntries.length === 0 && !initialError) {
      void loadEntries();
    }
  }, [initialEntries.length, initialError, loadEntries]);

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
      <SiteHeader variant="gallery" />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 lg:px-8 lg:pt-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm leading-relaxed text-slate-600">
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

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            {t("gallery.loading")}
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadEntries()}
              className="text-sm text-sage-600 underline"
            >
              {t("gallery.retry")}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            {t("gallery.empty")}
          </div>
        ) : (
          <>
            {topThreeEntries.length > 0 ? (
              <GalleryLeaderboard
                entries={topThreeEntries}
                displayText={displayText}
              />
            ) : null}

            <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
              {visibleEntries.map((entry) => (
                <GalleryCard
                  key={entry.entryId}
                  entry={entry}
                  displayTitle={displayText[entry.entryId]?.title}
                  displayConcept={displayText[entry.entryId]?.concept}
                  isTopTen={isTopTenByRank(voteRankMap.get(entry.entryId))}
                  onVoteCountChange={handleVoteCountChange}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-sage-700 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-sage-50"
                >
                  {t("gallery.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
    </VoteProvider>
  );
}
