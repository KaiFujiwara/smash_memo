/**
 * AWS Amplify プロバイダーコンポーネント
 * 
 * AWS Amplifyライブラリの初期化を行うプロバイダーです。
 * このコンポーネントが読み込まれると、Amplifyの設定が
 * 自動的に適用され、認証やAPIなどの機能が使用可能になります。
 */

'use client'

import { Amplify } from 'aws-amplify'
import config from '@/amplify_outputs.json'

// Amplifyの設定を初期化
Amplify.configure(config)

/**
 * AmplifyProviderコンポーネントのProps
 */
interface AmplifyProviderProps {
  children: React.ReactNode
}

/**
 * AWS Amplify プロバイダーコンポーネント
 * 
 * Amplifyの設定は上記で実行済みなので、
 * 子要素をそのまま返します。
 */
export const AmplifyProvider = ({ children }: AmplifyProviderProps) => {
  return <>{children}</>
}
