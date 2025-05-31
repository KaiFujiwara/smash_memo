/**
 * 認証サービス
 * 
 * AWS Amplifyの認証機能をラップしたサービス層です。
 * 認証に関するビジネスロジックをここに集約することで、
 * プレゼンテーション層（React コンポーネント）から
 * 認証の詳細実装を分離します。
 */

import { 
  getCurrentUser, 
  fetchUserAttributes, 
  signOut as amplifySignOut 
} from 'aws-amplify/auth'
import type { User, AuthError, SignInResult } from '@/types'

/**
 * 現在認証されているユーザーの情報を取得します
 * 
 * AWS Cognitoから現在のユーザー情報と属性を取得し、
 * アプリケーション内で使用する統一フォーマットに変換します。
 * 
 * @returns Promise<User> ユーザー情報
 * @throws {AuthError} 認証されていない場合やエラーが発生した場合
 */
export async function getCurrentUserInfo(): Promise<User> {
  try {
    // AWS Amplifyから現在のユーザー情報を取得
    const currentUser = await getCurrentUser()
    // ユーザーの属性情報（メールアドレスなど）を取得
    const attributes = await fetchUserAttributes()
    
    // アプリケーション内で使用する統一フォーマットに変換
    const user: User = {
      id: currentUser.userId,
      username: currentUser.username,
      email: attributes.email || '',
      displayName: attributes.email || currentUser.username,
      email_verified: attributes.email_verified === 'true'
    }
    
    return user
  } catch (error) {
    // エラーを統一フォーマットに変換して再throw
    const authError: AuthError = {
      name: (error as any)?.name || 'UnknownError',
      message: (error as any)?.message || '不明なエラーが発生しました',
      stack: (error as any)?.stack
    }
    throw authError
  }
}

/**
 * ユーザーをサインアウトさせます
 * 
 * AWS Cognitoからサインアウトし、ローカルの認証状態もクリアします。
 * 
 * @returns Promise<void>
 * @throws {AuthError} サインアウトに失敗した場合
 */
export async function signOut(): Promise<void> {
  try {
    await amplifySignOut()
  } catch (error) {
    const authError: AuthError = {
      name: (error as any)?.name || 'SignOutError',
      message: (error as any)?.message || 'サインアウトに失敗しました',
      stack: (error as any)?.stack
    }
    throw authError
  }
}

/**
 * ユーザーが認証されているかどうかを確認します
 * 
 * @returns Promise<boolean> 認証されている場合はtrue
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser()
    return true
  } catch {
    return false
  }
} 