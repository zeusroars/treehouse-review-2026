"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMockTranslation } from "@/lib/day4-lounge/mock-translate";
import type { Day4Language } from "@/types/day4-lounge";

interface TranslatedCommentProps {
  content: string;
  sourceLanguage: Day4Language | null;
  className?: string;
}

export default function TranslatedComment({
  content,
  sourceLanguage,
  className = "",
}: TranslatedCommentProps) {
  const { locale, t } = useLanguage();
  const [displayContent, setDisplayContent] = useState(content);
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setDisplayContent(content);
    setTranslated(false);
    setShowOriginal(false);

    if (!sourceLanguage || sourceLanguage === locale || !content.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchMockTranslation(content, sourceLanguage, locale)
      .then((result) => {
        if (cancelled) return;
        setDisplayContent(result);
        setTranslated(true);
      })
      .catch(() => {
        if (!cancelled) setDisplayContent(content);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [content, locale, sourceLanguage]);

  if (loading) {
    return (
      <div className="space-y-2 py-1" aria-label={t("day4.translating")}>
        <div className="h-3 w-full animate-pulse rounded bg-slate-400/20" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-slate-400/20" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-slate-400/20" />
      </div>
    );
  }

  return (
    <div className="relative">
      {translated ? (
        <span
          className="group absolute -top-7 right-0 z-10"
        >
          <button
            type="button"
            title={content}
            onClick={(event) => {
              event.stopPropagation();
              setShowOriginal((current) => !current);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/55 px-2 py-0.5 text-[9px] text-slate-500 backdrop-blur transition hover:bg-white/80"
          >
            <Sparkles className="h-2.5 w-2.5" />
            {t("day4.translated")}
          </button>
          <span
            className={`absolute right-0 top-full mt-1 w-64 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white shadow-xl ${
              showOriginal
                ? "block"
                : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
            }`}
          >
            <strong className="mb-1 block text-[10px] text-slate-300">
              {t("day4.originalText")}
            </strong>
            {content}
          </span>
        </span>
      ) : null}
      <p className={className}>{displayContent}</p>
    </div>
  );
}
