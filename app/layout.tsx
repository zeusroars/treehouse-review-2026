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

export const metadata: Metadata = {
  title: "2026 國際樹屋設計競賽",
  description:
    "2026 International Treehouse Design Competition — Gallery & Judge Portal",
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
