import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/index";
import Image from "next/image";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  description: "スマブラSPのキャラ対策メモアプリです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} relative min-h-screen`}>
        <div className="fixed inset-0 -z-10">
          <Image
            src="/background.png"
            alt="背景"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
            quality={80}
          />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
