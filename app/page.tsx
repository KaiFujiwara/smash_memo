/**
 * アプリケーションのルートページ
 * 
 * このページは認証状態に基づいてリダイレクトを行います。
 * - 認証済み: /dashboard にリダイレクト
 * - 未認証: /login にリダイレクト
 * 
 * 実際のコンテンツは表示せず、リダイレクト処理のみを行う
 * ルーティング専用のページです。
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/app/loading'

/**
 * ルートページコンポーネント
 * 
 * 認証状態を確認して適切なページにリダイレクトします。
 * リダイレクト中はローディング画面を表示します。
 */
export default function RootPage(): JSX.Element {
  // 認証フックから現在の認証状態を取得
  const { isAuthenticated, isLoading } = useAuth()
  // Next.jsのルーターフックを取得
  const router = useRouter()

  /**
   * 認証状態の変化を監視してリダイレクトを実行
   * 
   * useEffectの依存配列に認証関連の状態を含めることで、
   * 認証状態が変化したときに自動的にリダイレクトが実行されます。
   */
  useEffect(() => {
    // 認証状態の確認が完了するまで待機
    if (!isLoading) {
      if (isAuthenticated) {
        // 認証済みの場合はダッシュボードへ
        router.push('/dashboard')
      } else {
        // 未認証の場合はログイン画面へ
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  /**
   * リダイレクト処理中はローディング画面を表示
   * 
   * 実際のリダイレクトが完了するまでの間、
   * ユーザーにローディング状態を示します。
   */
  return <Loading />
}
