"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface ScoreSliderProps {
  label: string;
  weight: number;
  value: number;
  onChange: (value: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  compact?: boolean;
}

export default function ScoreSlider({
  label,
  weight,
  value,
  onChange,
  comment,
  onCommentChange,
  compact = false,
}: ScoreSliderProps) {
  const { t } = useLanguage();
  const percentage = (value / 10) * 100;

  return (
    <div
      className={`group rounded-2xl bg-white/60 shadow-sm ring-1 ring-slate-200/60 transition-all duration-300 hover:shadow-md hover:ring-sage-200/80 ${
        compact ? "p-3.5" : "p-5"
      }`}
    >
      <div className={`flex items-start justify-between gap-2 ${compact ? "mb-2.5" : "mb-4"}`}>
        <div className="min-w-0">
          <h3 className={`font-medium text-slate-800 ${compact ? "text-xs leading-snug" : "text-sm"}`}>
            {label}
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {t("scoreSlider.weight", { weight })}
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-sage-50 font-semibold tabular-nums text-sage-700 transition-colors duration-200 group-hover:bg-sage-100 ${
            compact ? "h-8 min-w-[2.25rem] px-1.5 text-base" : "h-9 min-w-[3rem] px-2 text-lg"
          }`}
        >
          {value}
        </div>
      </div>

      <div className={compact ? "relative mb-2.5" : "relative mb-4"}>
        <div className="absolute inset-y-0 left-0 h-1.5 rounded-full bg-sage-300/60 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative z-10 focus:outline-none"
          aria-label={t("scoreSlider.scoreAria", { label })}
        />
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-300">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder={t("scoreSlider.commentPlaceholder")}
        rows={compact ? 1 : 2}
        className={`w-full resize-none rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 placeholder:text-slate-300 transition-all duration-200 focus:border-sage-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-200/60 ${
          compact ? "px-3 py-2 text-xs" : "px-3.5 py-2.5 text-sm"
        }`}
      />
    </div>
  );
}
