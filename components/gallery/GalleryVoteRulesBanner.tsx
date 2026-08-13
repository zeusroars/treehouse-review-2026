"use client";

import { Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const RULE_KEYS = [
  "gallery.voteRulesItem1",
  "gallery.voteRulesItem2",
  "gallery.voteRulesItem3",
  "gallery.voteRulesItem4",
] as const;

export default function GalleryVoteRulesBanner() {
  const { t } = useLanguage();

  return (
    <section
      className="mb-8 rounded-xl border border-sage-200/90 bg-sage-50 px-4 py-5 shadow-sm sm:px-6 sm:py-6"
      aria-labelledby="gallery-vote-rules-title"
    >
      <h2
        id="gallery-vote-rules-title"
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-sage-900 sm:text-xl"
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200/80"
          aria-hidden
        >
          <Trophy className="h-5 w-5" />
        </span>
        {t("gallery.voteRulesTitle")}
      </h2>

      <ul className="mt-4 space-y-4 pl-1 sm:mt-5 sm:space-y-5">
        {RULE_KEYS.map((key) => (
          <li
            key={key}
            className="relative pl-5 text-sm leading-relaxed text-slate-700 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-sage-400 sm:text-[0.9375rem] sm:leading-7"
          >
            {t(key)}
          </li>
        ))}
      </ul>
    </section>
  );
}
