import type { Metadata } from "next";
import Day4LoungeClient from "@/components/judge/Day4LoungeClient";

export const metadata: Metadata = {
  title: "Day 3-4 Lounge · 決選非同步討論區",
  description: "2026 國際樹屋設計競賽 Day 3-4 決選評圖與評審非同步討論",
};

export default function Day4LoungePage() {
  return <Day4LoungeClient />;
}
