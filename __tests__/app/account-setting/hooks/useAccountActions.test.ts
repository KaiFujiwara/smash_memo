/**
 * useAccountActionsフックのテスト
 * アカウントのログアウトと削除操作のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAccountActions } from '@/app/(protected)/account-setting/hooks/useAccountActions'
import { signOut, deleteUser } from 'aws-amplify/auth'
import type { AccountSettingsState } from '@/app/(protected)/account-setting/types'

// 外部依存のモック
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('aws-amplify/auth', () => ({
  signOut: jest.fn(),
  deleteUser: jest.fn(),
}))

// window.confirmのモック
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

describe('useAccountActions', () => {
  let mockState: AccountSettingsState
  let mockUpdateState: jest.Mock
  let mockPush: jest.Mock

  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
  const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    mockConfirm.mockClear()

    // localStorageのモックをリセット
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })

    mockPush = jest.fn()
    mockUseRouter.mockReturnValue({ push: mockPush } as any)

    mockState = {
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      },
      isLoading: false,
      showSignOutConfirm: false,
      showDeleteConfirm: false,
      isSigningOut: false,
      isDeleting: false,
    }

    mockUpdateState = jest.fn()
    mockSignOut.mockResolvedValue()
    mockDeleteUser.mockResolvedValue()
    mockConfirm.mockReturnValue(true) // デフォルトは確認を承認
  })

  describe('handleSignOut', () => {
    it('ログアウトを正常に実行する', async () => {
      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ isSigningOut: true })
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(toast.success).toHaveBeenCalled()
    })

    it('ログアウトエラー時にトーストエラーを表示する', async () => {
      const error = new Error('ログアウトエラー')
      mockSignOut.mockRejectedValueOnce(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(console.error).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalled()
      expect(mockUpdateState).toHaveBeenCalledWith({ 
        isSigningOut: false,
        showSignOutConfirm: false 
      })

      consoleSpy.mockRestore()
    })
  })

  describe('handleDeleteAccount', () => {
    it('アカウント削除を実行する', async () => {
      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteAccount()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ isDeleting: true })
      expect(mockDeleteUser).toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith('accountDeleted', 'true')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
    
    // 確認ダイアログはカスタムコンポーネントで管理されるため、キャンセルテストは不要

    it('アカウント削除エラー時にトーストエラーを表示する', async () => {
      const error = new Error('削除エラー')
      mockDeleteUser.mockRejectedValueOnce(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteAccount()
      })

      expect(console.error).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalled()
      expect(mockUpdateState).toHaveBeenCalledWith({ 
        isDeleting: false,
        showDeleteConfirm: false 
      })
      // エラー時はlocalStorageは設定されない
      expect(localStorage.setItem).not.toHaveBeenCalledWith('accountDeleted', 'true')

      consoleSpy.mockRestore()
    })

    it('削除処理でログアウトエラーが発生した場合も適切に処理する', async () => {
      mockConfirm.mockReturnValue(true)
      const signOutError = new Error('ログアウトエラー')
      mockSignOut.mockRejectedValueOnce(signOutError)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteAccount()
      })

      // 削除は成功し、ログアウトエラーはキャッチされてリダイレクトは実行される
      expect(mockDeleteUser).toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('ログアウトエラー:', signOutError)
      expect(localStorage.setItem).toHaveBeenCalledWith('accountDeleted', 'true')
      expect(mockPush).toHaveBeenCalledWith('/login')

      consoleSpy.mockRestore()
    })
  })

  describe('ダイアログ制御', () => {
    it('ログアウト確認ダイアログを表示する', () => {
      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      act(() => {
        result.current.showSignOutConfirm()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ showSignOutConfirm: true })
    })

    it('アカウント削除確認ダイアログを表示する', () => {
      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      act(() => {
        result.current.showDeleteConfirm()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ showDeleteConfirm: true })
    })

    it('ダイアログをキャンセルする', () => {
      const { result } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      act(() => {
        result.current.cancelAction()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ 
        showSignOutConfirm: false,
        showDeleteConfirm: false 
      })
    })
  })

  describe('関数の再生成', () => {
    it('依存配列の値が変わらない限り、関数は再生成されない', () => {
      const { result, rerender } = renderHook(() =>
        useAccountActions({ state: mockState, updateState: mockUpdateState })
      )

      const firstRender = {
        handleSignOut: result.current.handleSignOut,
        handleDeleteAccount: result.current.handleDeleteAccount,
        showSignOutConfirm: result.current.showSignOutConfirm,
        showDeleteConfirm: result.current.showDeleteConfirm,
        cancelAction: result.current.cancelAction,
      }

      // 同じpropsで再レンダリング
      rerender()

      expect(result.current.handleSignOut).toBe(firstRender.handleSignOut)
      expect(result.current.handleDeleteAccount).toBe(firstRender.handleDeleteAccount)
      expect(result.current.showSignOutConfirm).toBe(firstRender.showSignOutConfirm)
      expect(result.current.showDeleteConfirm).toBe(firstRender.showDeleteConfirm)
      expect(result.current.cancelAction).toBe(firstRender.cancelAction)
    })
  })
})