"use client";

import { useCallback, useEffect } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GalleryLoginInterceptModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GalleryLoginInterceptModal({
  open,
  onClose,
}: GalleryLoginInterceptModalProps) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-login-intercept-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/80 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={t("gallery.loginModalClose")}
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="gallery-login-intercept-title"
          className="pr-10 text-lg font-semibold leading-snug text-slate-800"
        >
          {t("gallery.loginModalTitle")}
        </h2>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700">
          {t("gallery.loginModalSecurityWarning")}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() =>
              void signIn("line", { callbackUrl: window.location.href })
            }
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#06C755] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#05b34c]"
          >
            {t("gallery.loginModalLineButton")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            {t("gallery.loginModalCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
