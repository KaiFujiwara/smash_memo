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

/**
 * AWS Amplifyの設定を初期化
 * 
 * amplify_outputs.json には以下の設定が含まれています：
 * - 認証設定（Cognito User Pool）
 * - API設定（GraphQL/REST API）
 * - ストレージ設定（S3）など
 * 
 * この設定はAmplify CLIによって自動生成されます。
 */
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
 * 実際の処理はAmplify.configure()で完了しているため、
 * このコンポーネント自体は子要素をそのまま返すだけです。
 * 
 * ただし、Amplifyの初期化が確実に実行されるよう、
 * プロバイダーパターンとして実装しています。
 */
export const AmplifyProvider = ({ children }: AmplifyProviderProps) => {
  return <>{children}</>
}
