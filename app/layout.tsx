import type { Metadata } from "next";
import { Noto_Sans_TC, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const siteUrl =
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3001");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "2026 國際樹屋設計競賽 · 線上人氣票選",
    template: "%s · 2026 國際樹屋設計競賽",
  },
  description:
    "歡迎參加 2026 國際樹屋競賽線上人氣票選！活動期間 9/15–9/30，前三名可獲飛牛牧場住宿券。由臺灣樹屋協會主辦。",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "臺灣樹屋協會",
    title: "2026 國際樹屋競賽（少兒組）線上人氣票選",
    description:
      "歡迎參加 2026 國際樹屋競賽線上人氣票選！活動期間 9/15–9/30，前三名可獲飛牛牧場住宿券。由臺灣樹屋協會主辦。",
    images: [
      {
        url: "/og.jpg",
        width: 536,
        height: 1024,
        alt: "2026 國際樹屋競賽（少兒組）線上人氣票選",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 國際樹屋競賽（少兒組）線上人氣票選",
    description:
      "歡迎參加 2026 國際樹屋競賽線上人氣票選！活動期間 9/15–9/30，前三名可獲飛牛牧場住宿券。",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${notoSansTC.variable}`}>
      <body className="font-[family-name:var(--font-noto-sans-tc),var(--font-inter),sans-serif]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
