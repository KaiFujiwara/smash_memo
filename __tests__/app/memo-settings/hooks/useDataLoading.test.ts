/**
 * useDataLoadingフックのテスト
 * 認証状態に基づいてメモ項目データを取得する処理のテスト
 */

import { renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { useDataLoading } from '@/app/(protected)/memo-settings/hooks/useDataLoading'
import { getMemoItems } from '@/services/memoItemService'
import type { MemoItem } from '@/types'

// 外部依存のモック
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('@/services/memoItemService', () => ({
  getMemoItems: jest.fn(),
}))

describe('useDataLoading', () => {
  const mockUpdateState = jest.fn()
  const mockResetInitialState = jest.fn()
  const mockGetMemoItems = getMemoItems as jest.MockedFunction<typeof getMemoItems>

  const mockItems: MemoItem[] = [
    {
      id: '1',
      name: 'テスト項目1',
      order: 1,
      visible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'テスト項目2',
      order: 2,
      visible: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn() // console.errorをモック化してテスト出力をクリーンに保つ
  })

  it('認証済みの場合、メモ項目を正常に取得して設定する', async () => {
    mockGetMemoItems.mockResolvedValueOnce({ items: mockItems })

    renderHook(() =>
      useDataLoading({
        isAuthenticated: true,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalled()
    })

    // 正しい順序で状態が更新されることを確認
    expect(mockUpdateState).toHaveBeenCalledWith({ items: mockItems })
    expect(mockResetInitialState).toHaveBeenCalledWith(mockItems)
    expect(mockUpdateState).toHaveBeenCalledWith({ isLoading: false })

    // エラートーストが表示されていないことを確認
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('未認証の場合もメモ項目を取得する', async () => {
    mockGetMemoItems.mockResolvedValueOnce({ items: mockItems })

    renderHook(() =>
      useDataLoading({
        isAuthenticated: false,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalled()
    })

    expect(mockUpdateState).toHaveBeenCalledWith({ items: mockItems })
    expect(mockResetInitialState).toHaveBeenCalledWith(mockItems)
    expect(mockUpdateState).toHaveBeenCalledWith({ isLoading: false })
  })

  it('認証状態が未定義の場合はデータ取得を行わない', async () => {
    renderHook(() =>
      useDataLoading({
        isAuthenticated: undefined,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    // 少し待機してもAPIが呼ばれないことを確認
    await waitFor(() => {
      expect(mockGetMemoItems).not.toHaveBeenCalled()
    }, { timeout: 100 })

    expect(mockUpdateState).not.toHaveBeenCalled()
    expect(mockResetInitialState).not.toHaveBeenCalled()
  })

  it('データ取得でエラーが発生した場合、エラー処理を行う', async () => {
    const error = new Error('API Error')
    mockGetMemoItems.mockRejectedValueOnce(error)

    renderHook(() =>
      useDataLoading({
        isAuthenticated: true,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalled()
    })

    // エラー時の処理を確認
    expect(console.error).toHaveBeenCalledWith('メモ項目の取得に失敗:', error)
    expect(toast.error).toHaveBeenCalledWith('メモ項目の取得に失敗しました')
    
    // 空の配列で状態を更新
    expect(mockUpdateState).toHaveBeenCalledWith({ items: [] })
    expect(mockResetInitialState).toHaveBeenCalledWith([])
    
    // finallyブロックも実行される
    expect(mockUpdateState).toHaveBeenCalledWith({ isLoading: false })
  })

  it('認証状態が変更された場合、再度データを取得する', async () => {
    mockGetMemoItems.mockResolvedValue({ items: mockItems })

    const { rerender } = renderHook(
      ({ isAuthenticated }) =>
        useDataLoading({
          isAuthenticated,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        }),
      {
        initialProps: { isAuthenticated: undefined as boolean | undefined },
      }
    )

    // 初回は認証状態が未定義なので何も起こらない
    await waitFor(() => {
      expect(mockGetMemoItems).not.toHaveBeenCalled()
    }, { timeout: 100 })

    // 認証状態をtrueに変更
    rerender({ isAuthenticated: true })

    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalledTimes(1)
    })

    // 認証状態をfalseに変更
    rerender({ isAuthenticated: false })

    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalledTimes(2)
    })
  })

  it('コンポーネントがアンマウントされてもエラーが発生しない', async () => {
    mockGetMemoItems.mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => resolve({ items: mockItems }), 100)
      })
    )

    const { unmount } = renderHook(() =>
      useDataLoading({
        isAuthenticated: true,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    // すぐにアンマウント
    unmount()

    // エラーが発生しないことを確認
    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalled()
    })
  })

  it('空の項目リストが返されても正常に処理する', async () => {
    mockGetMemoItems.mockResolvedValueOnce({ items: [] })

    renderHook(() =>
      useDataLoading({
        isAuthenticated: true,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
      })
    )

    await waitFor(() => {
      expect(mockGetMemoItems).toHaveBeenCalled()
    })

    expect(mockUpdateState).toHaveBeenCalledWith({ items: [] })
    expect(mockResetInitialState).toHaveBeenCalledWith([])
    expect(mockUpdateState).toHaveBeenCalledWith({ isLoading: false })
    expect(toast.error).not.toHaveBeenCalled()
  })
})