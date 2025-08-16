/**
 * useAccountDataフックのテスト
 * アカウント情報の取得処理のテスト
 */

import { renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useAccountData } from '@/app/(protected)/account-setting/hooks/useAccountData'
import { getCurrentUserInfo } from '@/services/authService'
import type { AccountSettingsState, UserInfo } from '@/app/(protected)/account-setting/types'

// 外部依存のモック
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('@/services/authService', () => ({
  getCurrentUserInfo: jest.fn(),
}))

describe('useAccountData', () => {
  let mockUpdateState: jest.Mock
  const mockGetCurrentUserInfo = getCurrentUserInfo as jest.MockedFunction<typeof getCurrentUserInfo>

  const mockUser: UserInfo = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    mockUpdateState = jest.fn()
  })

  it('ユーザー情報を正常に取得する', async () => {
    mockGetCurrentUserInfo.mockResolvedValueOnce(mockUser)

    renderHook(() => useAccountData({ updateState: mockUpdateState }))

    // ローディング開始時の状態確認は不要（初期状態で isLoading: true のため）

    await waitFor(() => {
      expect(mockGetCurrentUserInfo).toHaveBeenCalled()
    })

    // ユーザー情報が設定され、ローディングが終了することを確認
    expect(mockUpdateState).toHaveBeenCalledWith({
      user: mockUser,
      isLoading: false,
    })

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('ユーザー情報取得でエラーが発生した場合、エラー処理を行う', async () => {
    const error = new Error('認証エラー')
    mockGetCurrentUserInfo.mockRejectedValueOnce(error)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderHook(() => useAccountData({ updateState: mockUpdateState }))

    await waitFor(() => {
      expect(mockGetCurrentUserInfo).toHaveBeenCalled()
    })

    // エラー時の処理を確認
    expect(console.error).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
    
    // userはnullのまま、ローディングが終了することを確認
    expect(mockUpdateState).toHaveBeenCalledWith({
      user: null,
      isLoading: false,
    })

    consoleSpy.mockRestore()
  })

  it('複数回レンダリングされても一度だけデータを取得する', async () => {
    mockGetCurrentUserInfo.mockResolvedValue(mockUser)

    const { rerender } = renderHook(() => useAccountData({ updateState: mockUpdateState }))

    // 再レンダリング
    rerender()
    rerender()

    await waitFor(() => {
      expect(mockGetCurrentUserInfo).toHaveBeenCalledTimes(1)
    })
  })

  it('updateState関数が変更されても再度データ取得しない', async () => {
    mockGetCurrentUserInfo.mockResolvedValue(mockUser)

    const { rerender } = renderHook(
      ({ updateState }) => useAccountData({ updateState }),
      {
        initialProps: { updateState: mockUpdateState },
      }
    )

    await waitFor(() => {
      expect(mockGetCurrentUserInfo).toHaveBeenCalledTimes(1)
    })

    // updateState関数を変更して再レンダリング
    const newMockUpdateState = jest.fn()
    rerender({ updateState: newMockUpdateState })

    // 少し待ってから、追加でAPI呼び出しが発生していないことを確認
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(mockGetCurrentUserInfo).toHaveBeenCalledTimes(1)
  })

  it('コンポーネントがアンマウントされてもエラーが発生しない', async () => {
    mockGetCurrentUserInfo.mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => resolve(mockUser), 100)
      })
    )

    const { unmount } = renderHook(() => useAccountData({ updateState: mockUpdateState }))

    // すぐにアンマウント
    unmount()

    // エラーが発生しないことを確認
    await waitFor(() => {
      expect(mockGetCurrentUserInfo).toHaveBeenCalled()
    })
  })
})