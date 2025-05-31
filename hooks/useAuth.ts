/**
 * 認証状態を管理するカスタムフック
 * 
 * このフックは、認証コンテキストから認証関連の状態と操作を取得します。
 * React Hooksの仕組みを使って、コンポーネントから簡単に認証情報に
 * アクセスできるようにしています。
 */

'use client'

import { useContext } from 'react'
import { AuthContext } from '@/contexts/authContext'
import type { AuthContextType } from '@/types'

/**
 * 認証フック
 * 
 * 認証コンテキストから現在の認証状態を取得するためのカスタムフックです。
 * 
 * 使用例:
 * ```typescript
 * const { user, isAuthenticated, signOut } = useAuth()
 * 
 * if (isAuthenticated) {
 *   console.log(`ログイン中: ${user.displayName}`)
 * }
 * ```
 * 
 * @returns {AuthContextType} 認証関連の状態と操作
 * @throws {Error} AuthProvider でラップされていない場合
 */
export const useAuth = (): AuthContextType => {
  // React Contextから値を取得
  const context = useContext(AuthContext)
  
  // Providerの外で使用された場合のエラーチェック
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'AuthProviderコンポーネントでラップしてください。'
    )
  }
  
  return context
}