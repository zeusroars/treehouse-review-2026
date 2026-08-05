"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

const ReviewWorkspace = dynamic(() => import("@/components/ReviewWorkspace"), {
  ssr: false,
  loading: () => <ReviewBootScreen />,
});

function ReviewBootScreen() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-wood-50 px-6">
      <div className="text-center">
        <p className="text-sm text-slate-500">{t("judge.booting")}</p>
        <p className="mt-2 text-xs text-slate-400">{t("judge.bootHint")}</p>
      </div>
    </div>
  );
}

export default function ReviewAppClient() {
  return <ReviewWorkspace />;
}
