import type { Metadata } from "next";
import AdminDashboardClient from "@/components/judge/AdminDashboardClient";

export const metadata: Metadata = {
  title: "2026 國際樹屋設計競賽 · 決選統計儀表板",
  description: "Admin dashboard for final-round score statistics",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
