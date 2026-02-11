/**
 * authService のテスト
 *
 * 認証サービスのビジネスロジックをテストします。
 * AWS Amplify Auth のモックを使用しています。
 */

// モックの実装を保持するオブジェクト
const mocks = {
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
  signOut: jest.fn(),
}

// Amplify Auth のモック
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: () => mocks.getCurrentUser(),
  fetchUserAttributes: () => mocks.fetchUserAttributes(),
  signOut: () => mocks.signOut(),
}))

// サービスのインポート
import {
  getCurrentUserInfo,
  isUserAuthenticated,
  signOut,
} from '@/services/authService'

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUserInfo', () => {
    it('現在のユーザー情報を取得する', async () => {
      mocks.getCurrentUser.mockResolvedValue({
        userId: 'test-user-id',
        username: 'testuser',
      })
      mocks.fetchUserAttributes.mockResolvedValue({
        email: 'test@example.com',
      })

      const result = await getCurrentUserInfo()

      expect(result).toEqual({
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
      })
    })

    it('メールアドレスがない場合は空文字を返す', async () => {
      mocks.getCurrentUser.mockResolvedValue({
        userId: 'test-user-id',
        username: 'testuser',
      })
      mocks.fetchUserAttributes.mockResolvedValue({})

      const result = await getCurrentUserInfo()

      expect(result.email).toBe('')
    })

    it('認証されていない場合はエラーをスローする', async () => {
      const authError = new Error('User is not authenticated')
      authError.name = 'NotAuthorizedException'
      mocks.getCurrentUser.mockRejectedValue(authError)

      await expect(getCurrentUserInfo()).rejects.toMatchObject({
        name: 'NotAuthorizedException',
        message: 'User is not authenticated',
      })
    })

    it('fetchUserAttributesでエラーが発生した場合はエラーをスローする', async () => {
      mocks.getCurrentUser.mockResolvedValue({
        userId: 'test-user-id',
        username: 'testuser',
      })
      const error = new Error('Failed to fetch attributes')
      error.name = 'FetchError'
      mocks.fetchUserAttributes.mockRejectedValue(error)

      await expect(getCurrentUserInfo()).rejects.toMatchObject({
        name: 'FetchError',
        message: 'Failed to fetch attributes',
      })
    })
  })

  describe('isUserAuthenticated', () => {
    it('ユーザーが認証されている場合はtrueを返す', async () => {
      mocks.getCurrentUser.mockResolvedValue({
        userId: 'test-user-id',
        username: 'testuser',
      })

      const result = await isUserAuthenticated()

      expect(result).toBe(true)
    })

    it('ユーザーが認証されていない場合はfalseを返す', async () => {
      mocks.getCurrentUser.mockRejectedValue(
        new Error('User is not authenticated')
      )

      const result = await isUserAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('signOut', () => {
    it('正常にログアウトできる', async () => {
      mocks.signOut.mockResolvedValue(undefined)

      await expect(signOut()).resolves.toBeUndefined()
      expect(mocks.signOut).toHaveBeenCalledTimes(1)
    })

    it('ログアウトに失敗した場合はエラーをスローする', async () => {
      const error = new Error('Failed to sign out')
      error.name = 'SignOutError'
      mocks.signOut.mockRejectedValue(error)

      await expect(signOut()).rejects.toMatchObject({
        name: 'SignOutError',
        message: 'Failed to sign out',
      })
    })
  })
})
