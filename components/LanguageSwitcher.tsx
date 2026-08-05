"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";

const LOCALES: Locale[] = ["zh", "en", "ja"];

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          dark
            ? "bg-white/10 text-sage-100 ring-1 ring-white/15 hover:bg-white/15"
            : "bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
      >
        <Globe className="h-3.5 w-3.5 shrink-0 opacity-80" />
        <span>{t(`language.${locale}`)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("language.label")}
          className={`absolute right-0 z-50 mt-2 min-w-[9.5rem] overflow-hidden rounded-xl py-1 shadow-lg ring-1 ${
            dark
              ? "bg-slate-900/95 text-white ring-white/10 backdrop-blur-md"
              : "bg-white text-slate-700 ring-slate-200/80"
          }`}
        >
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? dark
                        ? "bg-sage-500/20 text-sage-200"
                        : "bg-sage-50 text-sage-700"
                      : dark
                        ? "hover:bg-white/10"
                        : "hover:bg-slate-50"
                  }`}
                >
                  {t(`language.${code}`)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
