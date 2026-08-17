"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchTranslatedTexts } from "@/lib/translate/client";
import type { Day4LoungeEntry } from "@/types/day4-lounge";

export function useLocalizedDay4Entry(entry: Day4LoungeEntry) {
  const { locale, t } = useLanguage();
  const [workTitle, setWorkTitle] = useState(entry.workTitle ?? "");
  const [workConcept, setWorkConcept] = useState(entry.workConcept ?? "");
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const title = entry.workTitle?.trim() ?? "";
    const concept = entry.workConcept?.trim() ?? "";
    setWorkTitle(title);
    setWorkConcept(concept);

    if (locale === "zh") {
      setTranslating(false);
      return;
    }

    const texts = [title, concept].filter(Boolean);
    if (texts.length === 0) {
      setTranslating(false);
      return;
    }

    let cancelled = false;
    setTranslating(true);

    void fetchTranslatedTexts(texts, locale)
      .then((translations) => {
        if (cancelled) return;
        let index = 0;
        if (title) {
          setWorkTitle(translations[index] ?? title);
          index += 1;
        }
        if (concept) {
          setWorkConcept(translations[index] ?? concept);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkTitle(title);
          setWorkConcept(concept);
        }
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entry.entryId, entry.workConcept, entry.workTitle, locale]);

  return {
    workTitle: workTitle || t("day4.noWorkTitle"),
    workConcept: workConcept || t("day4.noWorkConcept"),
    translating,
  };
}
