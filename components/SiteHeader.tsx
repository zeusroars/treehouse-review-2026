"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface SiteHeaderProps {
  variant?: "gallery" | "judge";
}

export default function SiteHeader({ variant = "gallery" }: SiteHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const onGallery = pathname === "/";
  const onJudge = pathname.startsWith("/judge");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-wood-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sage-500">
            {t("preview.brandTagline")}
          </p>
          <h1 className="truncate text-lg font-light tracking-wide text-slate-800 lg:text-xl">
            {variant === "judge" ? t("judge.pageTitle") : t("gallery.title")}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-slate-200/70">
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                onGallery
                  ? "bg-sage-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("gallery.navGallery")}
            </Link>
            <Link
              href="/judge"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                onJudge
                  ? "bg-sage-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("gallery.navJudge")}
            </Link>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
