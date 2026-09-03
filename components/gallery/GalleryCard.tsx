"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Flame, Heart, Loader2 } from "lucide-react";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useCategoryLabel, useLanguage } from "@/contexts/LanguageContext";
import { useVoteQuota } from "@/contexts/VoteContext";
import { formatVoteCount } from "@/lib/gallery-votes";
import { showVoteErrorAlert, showVoteSuccessAlert } from "@/lib/vote-alerts";
import {
  getOrCreateVoterId,
  getRemainingVotesLocal,
} from "@/lib/voter-id";
import {
  isQuotaExhaustedMessage,
  parseVoteApiResponse,
} from "@/lib/vote-api";
import { GALLERY_THUMB_WIDTH, buildDriveFullImageProxyUrl } from "@/lib/drive-thumbnail";
import type { GalleryEntryWithVotes, GalleryLightboxSelection } from "@/types/gallery";

interface GalleryCardProps {
  entry: GalleryEntryWithVotes;
  listIndex?: number;
  displayTitle?: string;
  displayConcept?: string;
  isTopTen?: boolean;
  onVoteCountChange?: (entryId: string, voteCount: number) => void;
  onImageClick?: (selection: GalleryLightboxSelection) => void;
}

function excerpt(text: string, max = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default function GalleryCard({
  entry,
  listIndex,
  displayTitle,
  displayConcept,
  isTopTen = false,
  onVoteCountChange,
  onImageClick,
}: GalleryCardProps) {
  const { t, locale } = useLanguage();
  const categoryLabel = useCategoryLabel(entry.category);
  const {
    isHydrated,
    quotaExhausted,
    votedEntryIds,
    recordVoteSuccess,
    markQuotaExhausted,
  } = useVoteQuota();

  const title =
    displayTitle?.trim() ||
    entry.workTitle?.trim() ||
    entry.entryId;
  const concept = excerpt(
    displayConcept?.trim() || entry.workConcept?.trim() || t("gallery.noConcept")
  );
  const hasThumbnail = Boolean(entry.thumbnailUrl);

  const [voteCount, setVoteCount] = useState(entry.voteCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasVoted = isHydrated && votedEntryIds.has(entry.entryId);
  const quotaLocked = isHydrated && quotaExhausted;
  const voteDisabled = quotaLocked || hasVoted || isSubmitting;

  useEffect(() => {
    setVoteCount(entry.voteCount);
  }, [entry.voteCount]);

  const votesFormatted = formatVoteCount(voteCount, locale);

  const buttonLabel = isSubmitting
    ? t("gallery.voteSubmitting")
    : quotaLocked
      ? t("gallery.votesExhausted")
      : hasVoted
        ? t("gallery.voted")
        : t("gallery.vote");

  const handleVote = useCallback(async () => {
    if (!isHydrated || voteDisabled) return;

    const previousCount = voteCount;
    const nextCount = previousCount + 1;

    setIsSubmitting(true);
    setVoteCount(nextCount);
    onVoteCountChange?.(entry.entryId, nextCount);

    try {
      const res = await fetch("/api/vote/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoNo: entry.entryId,
          voterId: getOrCreateVoterId(),
        }),
      });

      const raw = (await res.json()) as unknown;
      const result = parseVoteApiResponse(raw);

      if (!result.ok) {
        const quotaHit =
          result.remainingVotes === 0 ||
          isQuotaExhaustedMessage(result.message);
        if (quotaHit) {
          markQuotaExhausted();
        }
        throw new Error(result.message || t("gallery.voteFailed"));
      }

      const remaining =
        result.remainingVotes ?? Math.max(0, getRemainingVotesLocal() - 1);
      recordVoteSuccess(entry.entryId, remaining);

      await showVoteSuccessAlert(
        t("gallery.voteSuccessTitle"),
        t("gallery.voteSuccessRemaining", { count: remaining })
      );
    } catch (err) {
      setVoteCount(previousCount);
      onVoteCountChange?.(entry.entryId, previousCount);

      await showVoteErrorAlert(
        t("gallery.voteErrorTitle"),
        err instanceof Error ? err.message : t("gallery.voteFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isHydrated,
    voteDisabled,
    voteCount,
    entry.entryId,
    onVoteCountChange,
    t,
    markQuotaExhausted,
    recordVoteSuccess,
  ]);

  const handleImageClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!hasThumbnail || !entry.fileId || !onImageClick) return;
      onImageClick({
        entryId: entry.entryId,
        title,
        imageUrl: buildDriveFullImageProxyUrl(entry.fileId),
        displayRotation: entry.displayRotation,
      });
    },
    [hasThumbnail, entry.fileId, entry.entryId, entry.displayRotation, onImageClick, title]
  );

  const imageHoverClass =
    "transition-transform duration-300 group-hover/image:scale-105";

  return (
    <article
      className="group mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-sage-200/80"
      data-entry-id={entry.entryId}
      {...(listIndex != null ? { "data-gallery-index": listIndex } : {})}
    >
      <div className="relative overflow-hidden bg-slate-100">
        {hasThumbnail ? (
          <button
            type="button"
            onClick={handleImageClick}
            className="group/image block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-400"
            aria-label={t("gallery.lightboxOpen", { title })}
          >
            {entry.displayRotation ? (
              <RotatedContainImage
                src={entry.thumbnailUrl!}
                alt={title}
                rotation={entry.displayRotation}
                imgClassName={imageHoverClass}
              />
            ) : (
              <Image
                src={entry.thumbnailUrl!}
                alt={title}
                width={GALLERY_THUMB_WIDTH}
                height={GALLERY_THUMB_WIDTH}
                priority={false}
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className={`h-auto w-full object-contain ${imageHoverClass}`}
                style={{ width: "100%", height: "auto" }}
              />
            )}
          </button>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
            <FileText className="h-10 w-10 opacity-60" />
            <span className="font-mono text-xs tracking-wider opacity-70">
              {entry.entryId}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-sage-700 shadow-sm backdrop-blur-sm">
          {categoryLabel}
        </span>
        {isTopTen ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-md backdrop-blur-sm">
            {t("gallery.topTenBadge")}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4 lg:p-5">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-slate-400">
            {entry.entryId}
          </p>
          <h2 className="mt-1 text-base font-medium leading-snug text-slate-800">
            {title}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{concept}</p>
        <button
          type="button"
          onClick={() => void handleVote()}
          disabled={voteDisabled}
          aria-busy={isSubmitting}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-sage-500 hover:shadow-md disabled:hover:bg-sage-600 disabled:hover:shadow-sm ${
            isSubmitting
              ? "cursor-wait opacity-90 disabled:cursor-wait"
              : "disabled:cursor-not-allowed disabled:opacity-60"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          {buttonLabel}
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
            <Flame className="h-3 w-3 fill-white/25" aria-hidden />
            {votesFormatted}
          </span>
        </button>
      </div>
    </article>
  );
}
