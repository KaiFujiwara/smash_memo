/**
 * プロバイダー統合ファイル
 * 
 * アプリケーション全体で必要なプロバイダーを組み合わせて、
 * 単一のProviderコンポーネントとして提供します。
 * 
 * このパターンにより：
 * 1. RootLayoutでのプロバイダー設定がシンプルになる
 * 2. プロバイダーの順序を適切に管理できる
 * 3. 新しいプロバイダーの追加が容易になる
 */

'use client'

import { ReactNode } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { AmplifyProvider } from "@/providers/AmplifyProvider";

/**
 * プロバイダー統合コンポーネントのProps
 */
interface ProvidersProps {
  children: ReactNode
}

/**
 * 複数のプロバイダーを組み合わせたコンポーネント
 * 
 * プロバイダーの入れ子構造：
 * 1. AmplifyProvider: AWS Amplifyの設定を初期化
 * 2. AuthProvider: 認証状態を管理
 * 
 * この順序は重要です。AuthProviderはAmplifyの設定が
 * 完了してから認証処理を行う必要があります。
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AmplifyProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AmplifyProvider>
  )
}