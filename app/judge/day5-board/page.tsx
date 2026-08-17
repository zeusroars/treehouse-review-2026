import type { Metadata } from "next";
import Day5BoardClient from "@/components/judge/Day5BoardClient";

export const metadata: Metadata = {
  title: "Day 5 Chairman Board · 決選戰情板",
  description: "2026 國際樹屋設計競賽 Day 5 大會主席決選戰情板",
};

export default function Day5BoardPage() {
  return <Day5BoardClient />;
}
