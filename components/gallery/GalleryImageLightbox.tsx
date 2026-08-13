"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GalleryLightboxSelection } from "@/types/gallery";

interface GalleryImageLightboxProps {
  selection: GalleryLightboxSelection | null;
  onClose: () => void;
}

export default function GalleryImageLightbox({
  selection,
  onClose,
}: GalleryImageLightboxProps) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!selection) return;

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selection, handleKeyDown]);

  if (!selection) return null;

  const { title, imageUrl, entryId, displayRotation } = selection;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-lightbox-title"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[110] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 sm:right-4 sm:top-4"
        aria-label={t("gallery.lightboxClose")}
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="flex h-full w-full flex-col p-2 sm:p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative min-h-0 flex-1">
          {displayRotation ? (
            <RotatedContainImage
              src={imageUrl}
              alt={title}
              rotation={displayRotation}
              layout="fill"
              className="h-full w-full"
              imgClassName="select-none"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-contain"
              draggable={false}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-3 pt-10 sm:px-6 sm:pb-4">
            <p
              id="gallery-lightbox-title"
              className="max-w-full truncate text-center text-sm font-medium text-white sm:text-base"
            >
              <span className="font-mono text-white/70">{entryId}</span>
              <span className="mx-2 text-white/40">·</span>
              {title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
