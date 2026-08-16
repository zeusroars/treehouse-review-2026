"use client";

import { Inbox } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmptyEntriesStateProps {
  className?: string;
}

export default function EmptyEntriesState({
  className = "",
}: EmptyEntriesStateProps) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-16 text-center ${className}`}
    >
      <Inbox className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden />
      <p className="text-lg font-light text-slate-600">{t("common.emptyEntries")}</p>
    </div>
  );
}
