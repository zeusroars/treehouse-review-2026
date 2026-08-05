"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDesignStatement,
  resolveDesignStatementParts,
  type DesignStatementParts,
} from "@/lib/design-statement";
import { fetchTranslatedTexts } from "@/lib/translate/client";

type LocalizableField = keyof DesignStatementParts;

interface UseLocalizedDesignStatementInput {
  designConcept?: string;
  workTitle?: string;
  workConcept?: string;
  workConceptExtra?: string;
  entryId: string;
}

export function useLocalizedDesignStatement(
  input: UseLocalizedDesignStatementInput
) {
  const { locale, t } = useLanguage();
  const sourceParts = useMemo(
    () =>
      resolveDesignStatementParts({
        designConcept: input.designConcept,
        workTitle: input.workTitle,
        workConcept: input.workConcept,
        workConceptExtra: input.workConceptExtra,
      }),
    [
      input.designConcept,
      input.workTitle,
      input.workConcept,
      input.workConceptExtra,
    ]
  );

  const [displayParts, setDisplayParts] =
    useState<DesignStatementParts>(sourceParts);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayParts(sourceParts);

    if (locale === "zh") {
      setTranslateError(null);
      setTranslating(false);
      return;
    }

    const fields: LocalizableField[] = [
      "workTitle",
      "workConcept",
      "workConceptExtra",
    ];
    const items = fields
      .map((field) => ({
        field,
        text: sourceParts[field]?.trim() ?? "",
      }))
      .filter((item) => item.text.length > 0);

    if (items.length === 0) {
      setTranslating(false);
      return;
    }

    let cancelled = false;
    setTranslating(true);
    setTranslateError(null);

    void fetchTranslatedTexts(
      items.map((item) => item.text),
      locale
    )
      .then((translations) => {
        if (cancelled) return;
        const next: DesignStatementParts = {};
        items.forEach((item, index) => {
          next[item.field] = translations[index] ?? item.text;
        });
        setDisplayParts(next);
      })
      .catch((error) => {
        if (cancelled) return;
        setDisplayParts(sourceParts);
        setTranslateError(
          error instanceof Error ? error.message : t("scoring.translateFailed")
        );
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceParts, locale, input.entryId, t]);

  const formatted = useMemo(
    () =>
      formatDesignStatement(displayParts, {
        workTitle: t("scoring.workTitle"),
        workConcept: t("scoring.workConcept"),
        workConceptExtra: t("scoring.workConceptExtra"),
      }),
    [displayParts, t]
  );

  return { formatted, translating, translateError };
}
