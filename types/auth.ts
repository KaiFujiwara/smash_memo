/**
 * 認証関連の型定義
 * 
 * このファイルでは、アプリケーション全体で使用される認証に関連する型を定義しています。
 * AWS Amplifyの認証機能と連携して、型安全性を保ちながら認証状態を管理します。
 */

/**
 * ユーザーの基本情報
 * AWS Cognitoから取得されるユーザー属性に基づいて定義
 */
export interface User {
  /** ユーザーの一意識別子（Cognito User Pool内でのユーザーID） */
  id: string
  /** ユーザーのユーザー名（通常はメールアドレス） */
  username: string
  /** ユーザーのメールアドレス */
  email: string
}

/**
 * 認証コンテキストの型定義
 * 
 * Reactのコンテキスト経由で提供される認証関連の状態と操作を定義します。
 * この型は、アプリケーション全体で一貫した認証状態の管理を保証します。
 */
export interface AuthContextType {
  /** 現在ログインしているユーザーの情報（ログインしていない場合はnull） */
  user: User | null
  /** 現在の認証状態（true: ログイン済み, false: 未ログイン） */
  isAuthenticated: boolean
  /** 認証状態の確認中かどうか（初期化時やリフレッシュ時にtrue） */
  isLoading: boolean
  /** ユーザーをログアウトさせる関数 */
  signOut: () => Promise<void>
  /** ユーザー情報を再取得して状態を更新する関数 */
  refreshUser: () => Promise<void>
}

/**
 * 認証エラーの型定義
 * AWS Amplifyの認証エラーに基づいて定義
 */
export interface AuthError {
  /** エラーの種類を示すname */
  name: string
  /** エラーメッセージ */
  message: string
  /** エラーの詳細情報（存在する場合） */
  stack?: string
}

/**
 * サインイン処理の結果
 */
export interface SignInResult {
  /** サインインが成功したかどうか */
  success: boolean
  /** エラーが発生した場合のエラー情報 */
  error?: AuthError
  /** サインインしたユーザー情報（成功時のみ） */
  user?: User
}

/**
 * 認証状態の変更を表すイベント
 */
export type AuthStateChangeEvent = 'signIn' | 'signOut' | 'signUp' | 'tokenRefresh' 