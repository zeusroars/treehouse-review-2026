"use client";

import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConnectionErrorStateProps {
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

export default function ConnectionErrorState({
  onRetry,
  retrying = false,
  className = "",
}: ConnectionErrorStateProps) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-6 py-16 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Clock className="h-7 w-7 text-slate-400" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-medium text-slate-700">
          {t("common.connectionErrorTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">
          {t("common.connectionErrorDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {retrying ? t("common.connectionErrorRetrying") : t("common.connectionErrorRetry")}
      </button>
    </div>
  );
}
