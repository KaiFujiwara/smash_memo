import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/index";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "スマブラSPメモ",
  description: "スマブラSPのキャラ対策メモアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
