"use client";

import Image from "next/image";
import { Flame, FileText, Trophy } from "lucide-react";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useCategoryLabel, useLanguage } from "@/contexts/LanguageContext";
import { formatVoteCount } from "@/lib/gallery-votes";
import { GALLERY_THUMB_WIDTH } from "@/lib/drive-thumbnail";
import type { GalleryEntryWithVotes } from "@/types/gallery";

const RANK_STYLES = [
  {
    medal: "🥇",
    ring: "ring-amber-400/80",
    glow: "from-amber-100/80 via-amber-50 to-white",
    badge: "bg-amber-500 text-white",
    order: "lg:order-2 lg:-mt-4 lg:scale-[1.03]",
  },
  {
    medal: "🥈",
    ring: "ring-slate-300/80",
    glow: "from-slate-100/80 via-white to-white",
    badge: "bg-slate-500 text-white",
    order: "lg:order-1",
  },
  {
    medal: "🥉",
    ring: "ring-orange-300/70",
    glow: "from-orange-50/80 via-white to-white",
    badge: "bg-orange-600 text-white",
    order: "lg:order-3",
  },
] as const;

interface GalleryLeaderboardProps {
  entries: GalleryEntryWithVotes[];
  displayText: Record<string, { title?: string; concept?: string }>;
}

function LeaderboardCard({
  entry,
  rank,
  title,
}: {
  entry: GalleryEntryWithVotes;
  rank: number;
  title: string;
}) {
  const { t, locale } = useLanguage();
  const categoryLabel = useCategoryLabel(entry.category);
  const style = RANK_STYLES[rank - 1];
  const hasThumbnail = Boolean(entry.thumbnailUrl);
  const votesFormatted = formatVoteCount(entry.voteCount, locale);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b shadow-md ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.glow} ${style.ring} ${style.order}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {hasThumbnail ? (
          entry.displayRotation ? (
            <RotatedContainImage
              src={entry.thumbnailUrl!}
              alt={title}
              rotation={entry.displayRotation}
              layout="fill"
            />
          ) : (
            <Image
              src={entry.thumbnailUrl!}
              alt={title}
              width={GALLERY_THUMB_WIDTH}
              height={GALLERY_THUMB_WIDTH}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
            <FileText className="h-10 w-10 opacity-60" />
            <span className="font-mono text-xs tracking-wider opacity-70">
              {entry.entryId}
            </span>
          </div>
        )}

        <span
          className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-md ${style.badge}`}
          aria-hidden
        >
          {style.medal}
        </span>

        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-500/95 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
          <Flame className="h-3.5 w-3.5 fill-white/30" />
          {votesFormatted}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-700">
            {categoryLabel}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {entry.entryId}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
          {title}
        </h3>
        <p className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-orange-600">
          <Flame className="h-4 w-4 fill-orange-200 text-orange-500" />
          {t("gallery.voteCountLabel", { count: votesFormatted })}
        </p>
      </div>
    </article>
  );
}

export default function GalleryLeaderboard({
  entries,
  displayText,
}: GalleryLeaderboardProps) {
  const { t } = useLanguage();

  if (entries.length === 0) return null;

  return (
    <section
      className="mb-10 rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm lg:p-8"
      aria-labelledby="gallery-leaderboard-heading"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h2
            id="gallery-leaderboard-heading"
            className="text-lg font-semibold tracking-tight text-slate-800 lg:text-xl"
          >
            {t("gallery.leaderboardTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("gallery.leaderboardSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end lg:gap-5">
        {entries.map((entry, index) => {
          const title =
            displayText[entry.entryId]?.title?.trim() ||
            entry.workTitle?.trim() ||
            entry.entryId;

          return (
            <LeaderboardCard
              key={entry.entryId}
              entry={entry}
              rank={index + 1}
              title={title}
            />
          );
        })}
      </div>
    </section>
  );
}
