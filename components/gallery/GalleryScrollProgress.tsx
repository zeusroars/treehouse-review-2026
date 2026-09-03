"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const HIDE_DELAY_MS = 1500;
const SCROLL_THROTTLE_MS = 80;

/**
 * Masonry columns place entries out of strict vertical order. Progress uses:
 * 1) max index whose top crossed a scan line or scrolled off-screen above, and
 * 2) max index currently visible (so the last page shows total reached).
 */
function measureGalleryProgressIndex(): number {
  const cards = document.querySelectorAll<HTMLElement>("[data-gallery-index]");
  const scanLine = Math.max(96, window.innerHeight * 0.22);
  const viewportBottom = window.innerHeight;

  let maxReached = 0;
  let maxVisible = 0;

  cards.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const index = Number(el.dataset.galleryIndex);
    if (!Number.isFinite(index) || index <= 0) return;

    // Not yet entered viewport from below
    if (rect.top >= viewportBottom) return;

    const isVisible = rect.bottom > 0 && rect.top < viewportBottom;
    if (isVisible) {
      maxVisible = Math.max(maxVisible, index);
    }

    // Top crossed scan line, or card already scrolled above viewport
    if (rect.bottom <= 0 || rect.top <= scanLine) {
      maxReached = Math.max(maxReached, index);
    }
  });

  const raw = Math.max(maxReached, maxVisible);
  return raw > 0 ? raw : 1;
}

interface GalleryScrollProgressProps {
  totalCount: number;
  enabled?: boolean;
}

export default function GalleryScrollProgress({
  totalCount,
  enabled = true,
}: GalleryScrollProgressProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollAtRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const updateProgress = useCallback(() => {
    if (totalCount <= 0) return;

    const raw = Math.min(Math.max(measureGalleryProgressIndex(), 1), totalCount);
    const scrollY = window.scrollY;
    const scrollingDown = scrollY >= lastScrollYRef.current - 1;
    lastScrollYRef.current = scrollY;

    setCurrentIndex((prev) => {
      if (scrollingDown) {
        return Math.max(prev, raw);
      }
      return raw;
    });
  }, [totalCount]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    if (!enabled || totalCount <= 0) return;

    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      setVisible(true);
      scheduleHide();

      const now = Date.now();
      if (now - lastScrollAtRef.current < SCROLL_THROTTLE_MS) {
        if (!throttleTimerRef.current) {
          throttleTimerRef.current = setTimeout(() => {
            throttleTimerRef.current = null;
            lastScrollAtRef.current = Date.now();
            updateProgress();
          }, SCROLL_THROTTLE_MS);
        }
        return;
      }

      lastScrollAtRef.current = now;
      updateProgress();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    };
  }, [enabled, totalCount, scheduleHide, updateProgress]);

  if (!enabled || totalCount <= 0) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-opacity duration-300 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="rounded-full bg-white/70 px-4 py-2 font-sans text-xs font-medium tabular-nums tracking-wide text-slate-700 shadow-lg ring-1 ring-white/60 backdrop-blur-md">
        {t("gallery.scrollProgress", {
          current: currentIndex,
          total: totalCount,
        })}
      </div>
    </div>
  );
}
