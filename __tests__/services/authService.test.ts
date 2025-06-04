/**
 * authService のテスト
 * 
 * このテストファイルでは、認証サービス層の動作を検証します。
 * 外部依存関係（AWS Amplify）のモック方法や、
 * サービス層のテスト手法を学ぶことができます。
 */

import { getCurrentUserInfo, signOut, isUserAuthenticated } from '@/services/authService'
import { getCurrentUser, fetchUserAttributes, signOut as amplifySignOut } from 'aws-amplify/auth'

// AWS Amplifyの関数をモック化
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
  signOut: jest.fn(),
}))

// 型安全なモック関数の作成
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockFetchUserAttributes = fetchUserAttributes as jest.MockedFunction<typeof fetchUserAttributes>
const mockAmplifySignOut = amplifySignOut as jest.MockedFunction<typeof amplifySignOut>

describe('authService', () => {
  // 各テストの前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUserInfo', () => {
    /**
     * テスト1: 正常なユーザー情報取得
     * 
     * AWS Amplifyから正常にユーザー情報を取得できる場合の
     * 動作を確認します。
     */
    it('正常にユーザー情報を取得できる', async () => {
      // モックの戻り値を設定
      const mockCurrentUser = {
        userId: 'test-user-id',
        username: 'testuser@example.com',
      }
      const mockAttributes = {
        email: 'testuser@example.com',
        email_verified: 'true',
      }

      mockGetCurrentUser.mockResolvedValue(mockCurrentUser as any)
      mockFetchUserAttributes.mockResolvedValue(mockAttributes as any)

      // 関数を実行
      const result = await getCurrentUserInfo()

      // 結果を検証
      expect(result).toEqual({
        id: 'test-user-id',
        username: 'testuser@example.com',
        email: 'testuser@example.com',
        displayName: 'testuser@example.com',
        email_verified: true,
      })

      // モック関数が正しく呼び出されたことを確認
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(1)
      expect(mockFetchUserAttributes).toHaveBeenCalledTimes(1)
    })

    /**
     * テスト2: メールアドレスが未設定の場合
     * 
     * ユーザー属性にメールアドレスが含まれていない場合の
     * フォールバック処理を確認します。
     */
    it('メールアドレスが未設定の場合、空文字列とusernameでフォールバックする', async () => {
      const mockCurrentUser = {
        userId: 'test-user-id',
        username: 'testuser',
      }
      const mockAttributes = {
        // email フィールドなし
        email_verified: 'false',
      }

      mockGetCurrentUser.mockResolvedValue(mockCurrentUser as any)
      mockFetchUserAttributes.mockResolvedValue(mockAttributes as any)

      const result = await getCurrentUserInfo()

      expect(result).toEqual({
        id: 'test-user-id',
        username: 'testuser',
        email: '',
        displayName: 'testuser',
        email_verified: false,
      })
    })

    /**
     * テスト3: エラーハンドリング
     * 
     * AWS Amplifyからエラーが発生した場合の
     * エラー処理を確認します。
     */
    it('AWS Amplifyでエラーが発生した場合、適切にエラーを変換する', async () => {
      const amplifyError = new Error('User not authenticated')
      amplifyError.name = 'UserUnAuthenticatedException'

      mockGetCurrentUser.mockRejectedValue(amplifyError)

      await expect(getCurrentUserInfo()).rejects.toEqual({
        name: 'UserUnAuthenticatedException',
        message: 'User not authenticated',
        stack: amplifyError.stack,
      })
    })
  })

  describe('signOut', () => {
    /**
     * テスト4: 正常なログアウト
     * 
     * AWS Amplifyのログアウトが正常に実行される場合を確認します。
     */
    it('正常にログアウトできる', async () => {
      mockAmplifySignOut.mockResolvedValue(undefined)

      await expect(signOut()).resolves.toBeUndefined()
      expect(mockAmplifySignOut).toHaveBeenCalledTimes(1)
    })

    /**
     * テスト5: ログアウト時のエラーハンドリング
     * 
     * ログアウト処理でエラーが発生した場合の処理を確認します。
     */
    it('ログアウトでエラーが発生した場合、適切にエラーを変換する', async () => {
      const amplifyError = new Error('Network error')
      amplifyError.name = 'NetworkError'

      mockAmplifySignOut.mockRejectedValue(amplifyError)

      await expect(signOut()).rejects.toEqual({
        name: 'NetworkError',
        message: 'Network error',
        stack: amplifyError.stack,
      })
    })
  })

  describe('isUserAuthenticated', () => {
    /**
     * テスト6: 認証済みユーザーの確認
     * 
     * ユーザーが認証済みの場合にtrueを返すことを確認します。
     */
    it('認証済みの場合、trueを返す', async () => {
      mockGetCurrentUser.mockResolvedValue({} as any)

      const result = await isUserAuthenticated()
      expect(result).toBe(true)
    })

    /**
     * テスト7: 未認証ユーザーの確認
     * 
     * ユーザーが未認証の場合にfalseを返すことを確認します。
     */
    it('未認証の場合、falseを返す', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'))

      const result = await isUserAuthenticated()
      expect(result).toBe(false)
    })
  })
}) 