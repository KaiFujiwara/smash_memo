/**
 * 認証プロバイダーコンポーネント
 * 
 * アプリケーション全体に認証状態を提供するプロバイダーです。
 * React Contextパターンを使用して、認証に関する状態と操作を
 * 子コンポーネントに提供します。
 */

'use client'

import { useState, useEffect, ReactNode } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { getCurrentUserInfo, signOut as authSignOut } from '@/services/authService'
import type { User, AuthError } from '@/types'

/**
 * 認証プロバイダーのProps
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * 認証プロバイダーコンポーネント
 * 
 * このコンポーネントは以下の責務を持ちます：
 * 1. ユーザーの認証状態を管理
 * 2. ユーザー情報の取得と更新
 * 3. サインアウト処理
 * 4. 認証状態の変更を子コンポーネントに通知
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // ユーザー情報の状態（未ログイン時はnull）
  const [user, setUser] = useState<User | null>(null)
  // 認証処理の実行中かどうか（初期化時やリフレッシュ時）
  const [isLoading, setIsLoading] = useState(true)
  // 現在のログイン状態
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * ユーザー情報を取得して状態を更新する関数
   * 
   * この関数は以下のタイミングで呼び出されます：
   * - コンポーネントの初期化時
   * - 手動でユーザー情報をリフレッシュしたい時
   */
  const refreshUser = async (): Promise<void> => {
    try {
      // サービス層からユーザー情報を取得
      const currentUser = await getCurrentUserInfo()
      
      // 状態を更新（認証成功）
      setUser(currentUser)
      setIsAuthenticated(true)
    } catch (error) {
      // エラーハンドリング
      const authError = error as AuthError
      
      // 未認証エラーの場合は通常の動作なのでコンソールに出力しない
      if (authError.name !== 'UserUnAuthenticatedException') {
        console.error('認証エラー:', authError.message)
      }
      
      // 状態をリセット（認証失敗）
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      // ローディング状態を終了
      setIsLoading(false)
    }
  }

  /**
   * ユーザーをサインアウトさせる関数
   * 
   * AWS Cognitoからサインアウトし、ローカルの状態もリセットします。
   */
  const signOut = async (): Promise<void> => {
    try {
      // サービス層でサインアウト処理を実行
      await authSignOut()
    } catch (error) {
      const authError = error as AuthError
      console.error('サインアウト失敗:', authError.message)
    } finally {
      // 成功・失敗に関わらず、ローカルの状態はリセット
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  /**
   * コンポーネントの初期化時にユーザー情報を取得
   * 
   * useEffectの依存配列が空配列なので、コンポーネントの
   * マウント時に1回だけ実行されます。
   */
  useEffect(() => {
    refreshUser()
  }, [])

  /**
   * Context Providerで子コンポーネントに値を提供
   * 
   * value に渡されたオブジェクトが、useAuthフック経由で
   * 子コンポーネントからアクセスできるようになります。
   */
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
