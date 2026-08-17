"use client";

import PreviewImageViewer from "@/components/PreviewImageViewer";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PreviewFile } from "@/types/review";

interface PreviewPanelProps {
  entryId: string;
  files: PreviewFile[];
  currentPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  displayRotation?: number;
}

export default function PreviewPanel({
  entryId,
  files = [],
  currentPage,
  onPageChange,
  loading = false,
  displayRotation = 0,
}: PreviewPanelProps) {
  const { t } = useLanguage();
  const totalPages = Math.max(files.length, 1);
  const activeFile = files[currentPage - 1];

  return (
    <section className="relative flex h-full min-h-[50vh] min-w-0 flex-1 flex-col bg-slate-900 lg:min-h-0">
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-stretch justify-center px-2 py-2 lg:px-4 lg:py-3">
          <div className="relative min-h-0 w-full max-w-5xl flex-1">
            {loading ? (
              <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-2xl bg-slate-950 text-sm text-white/50">
                {t("preview.loadingFiles")}
              </div>
            ) : activeFile ? (
              activeFile.type === "pdf" ? (
                <div className="relative h-full min-h-[50vh] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
                  <iframe
                    title={`${entryId} PDF ${currentPage}`}
                    src={activeFile.previewUrl}
                    className="absolute inset-0 h-full w-full border-0 bg-slate-900"
                    allow="autoplay"
                  />
                </div>
              ) : (
                <PreviewImageViewer
                  src={activeFile.previewUrl}
                  alt={`${entryId} ${t("preview.imageAlt")}`}
                  rotation={displayRotation}
                  className="absolute inset-0 h-full w-full"
                  viewportClassName="h-full min-h-[50vh] lg:min-h-0"
                  overlay={
                    <div className="p-5 lg:p-8">
                      <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/50">
                        {t("preview.entryIdLabel")}
                      </p>
                      <p className="mt-1 font-mono text-xl font-light tracking-widest text-white lg:text-3xl">
                        {entryId}
                      </p>
                      <p className="mt-2 text-sm text-white/40">
                        {t("preview.anonymousReview")}
                        {totalPages > 1 ? ` · ${currentPage} / ${totalPages}` : null}
                      </p>
                    </div>
                  }
                />
              )
            ) : (
              <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-950 text-white/50">
                <p className="text-sm">{t("preview.noFiles")}</p>
                <p className="text-xs text-white/30">{t("preview.sheetLinkHint")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
