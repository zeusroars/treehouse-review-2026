import type { Metadata } from "next";
import ReviewAppClient from "@/components/ReviewAppClient";

export const metadata: Metadata = {
  title: "2026 國際樹屋設計競賽 · 評審專區",
  description: "Judge portal — 2026 International Treehouse Design Competition",
};

export default function JudgePage() {
  return <ReviewAppClient />;
}
