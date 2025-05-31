/**
 * 認証コンテキスト
 * 
 * React Contextを使用して、アプリケーション全体で認証状態を共有します。
 * このコンテキストにより、コンポーネントツリーのどこからでも
 * 認証情報にアクセスできるようになります。
 */

import { createContext } from 'react'
import type { AuthContextType } from '@/types'

/**
 * 認証コンテキストの作成
 * 
 * 初期値はnullに設定し、実際の値はAuthProviderから提供されます。
 * このパターンにより、Providerでラップされていないコンポーネントでの
 * 誤用を防ぐことができます。
 */
export const AuthContext = createContext<AuthContextType | null>(null)
