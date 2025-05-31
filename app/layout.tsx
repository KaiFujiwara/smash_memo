/**
 * アプリケーションのルートレイアウト
 * 
 * Next.js App Routerにおけるルートレイアウトファイルです。
 * すべてのページで共通して使用されるHTML構造とスタイルを定義します。
 * 
 * 主な役割：
 * 1. HTMLの基本構造の定義
 * 2. 全体的なスタイルの適用
 * 3. プロバイダーの設定
 * 4. メタデータの設定
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/index";
import Image from "next/image";

/**
 * Googleフォント（Inter）の設定
 * 
 * Next.jsのフォント最適化機能を使用してInterフォントを読み込みます。
 * subsetsにlalinを指定することで、必要な文字セットのみを読み込みます。
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * ページのメタデータ設定
 * 
 * Next.jsのMetadata APIを使用して、SEOに関連する情報を設定します。
 * titleは各ページで個別に設定される可能性があるため、ここではdescriptionのみ設定。
 */
export const metadata: Metadata = {
  description: "スマブラSPのキャラ対策メモアプリです。",
};

/**
 * ルートレイアウトコンポーネントのProps
 */
interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * ルートレイアウトコンポーネント
 * 
 * アプリケーション全体の基本構造を定義します。
 * すべてのページがこのレイアウト内でレンダリングされます。
 */
export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} relative min-h-screen`}>
        {/* 背景画像の設定 */}
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
        
        {/* プロバイダーで全体をラップしてグローバル状態を提供 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
