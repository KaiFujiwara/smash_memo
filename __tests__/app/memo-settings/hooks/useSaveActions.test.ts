/**
 * useSaveActionsフックのテスト
 * メモ項目のデータベース保存処理のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useSaveActions } from '@/app/(protected)/memo-settings/hooks/useSaveActions'
import {
  createMemoItem,
  updateMemoItem,
  bulkUpdateMemoItemOrder,
  getNextOrder,
} from '@/services/memoItemService'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'
import type { MemoItem } from '@/types'

// 外部依存のモック
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/services/memoItemService', () => ({
  createMemoItem: jest.fn(),
  updateMemoItem: jest.fn(),
  bulkUpdateMemoItemOrder: jest.fn(),
  getNextOrder: jest.fn(),
}))

describe('useSaveActions', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock
  let mockResetInitialState: jest.Mock

  const mockCreateMemoItem = createMemoItem as jest.MockedFunction<typeof createMemoItem>
  const mockUpdateMemoItem = updateMemoItem as jest.MockedFunction<typeof updateMemoItem>
  const mockBulkUpdateMemoItemOrder = bulkUpdateMemoItemOrder as jest.MockedFunction<typeof bulkUpdateMemoItemOrder>
  const mockGetNextOrder = getNextOrder as jest.MockedFunction<typeof getNextOrder>

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()

    // 初期状態のモック
    mockState = {
      items: [
        {
          id: '1',
          name: '既存項目1',
          order: 0,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'temp-1',
          name: '新規項目1',
          order: 1,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: '既存項目2（更新）',
          order: 2,
          visible: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      newItemName: '',
      editingId: null,
      editingName: '',
      isLoading: false,
      isSaving: false,
      isAdding: false,
      showDeleteConfirm: null,
      showUnsavedWarning: false,
      draggingId: null,
      forceUpdateCounter: 0,
      pendingChanges: [],
      nextTempId: 2,
      pendingNavigation: null,
    }

    mockUpdateState = jest.fn()
    mockResetInitialState = jest.fn()

    // デフォルトのモック実装
    mockGetNextOrder.mockResolvedValue(10)
    mockCreateMemoItem.mockResolvedValue({
      success: true,
      item: {
        id: 'created-1',
        name: '新規項目1',
        order: 10,
        visible: true,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    })
    mockUpdateMemoItem.mockResolvedValue({ success: true })
    mockBulkUpdateMemoItemOrder.mockResolvedValue({ success: true })
  })

  describe('handleSaveChanges', () => {
    it('新規項目と既存項目を正しく保存する', async () => {
      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      // isSavingがtrueに設定される
      expect(mockUpdateState).toHaveBeenCalledWith({ isSaving: true })

      // 新規項目の作成を確認
      expect(mockGetNextOrder).toHaveBeenCalledTimes(1)
      expect(mockCreateMemoItem).toHaveBeenCalledWith({
        name: '新規項目1',
        order: 10,
        visible: true,
      })

      // 既存項目の更新を確認
      expect(mockUpdateMemoItem).toHaveBeenCalledTimes(2)
      expect(mockUpdateMemoItem).toHaveBeenCalledWith({
        id: '1',
        name: '既存項目1',
      })
      expect(mockUpdateMemoItem).toHaveBeenCalledWith({
        id: '2',
        name: '既存項目2（更新）',
      })

      // 順序の一括更新を確認
      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '1', order: 0 },
        { id: 'created-1', order: 1 },
        { id: '2', order: 2 },
      ])

      // 最終的な状態更新を確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({ id: '1', order: 0 }),
          expect.objectContaining({ id: 'created-1', order: 1 }),
          expect.objectContaining({ id: '2', order: 2 }),
        ]),
        isSaving: false,
        forceUpdateCounter: 1,
        nextTempId: 1,
      })

      // 初期状態のリセットを確認
      expect(mockResetInitialState).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: 'created-1' }),
          expect.objectContaining({ id: '2' }),
        ])
      )

      // 成功トーストを確認
      expect(toast.success).toHaveBeenCalledWith(
        '🎉 メモ項目の設定を保存しました！',
        expect.objectContaining({
          description: '変更内容がデータベースに反映されました',
          duration: 2500,
        })
      )
    })

    it('新規項目のみの場合も正しく処理する', async () => {
      mockState.items = [
        {
          id: 'temp-1',
          name: '新規項目1',
          order: 0,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(mockCreateMemoItem).toHaveBeenCalledTimes(1)
      expect(mockUpdateMemoItem).not.toHaveBeenCalled()
      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: 'created-1', order: 0 },
      ])
    })

    it('既存項目のみの場合も正しく処理する', async () => {
      mockState.items = [
        {
          id: '1',
          name: '既存項目1',
          order: 0,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(mockCreateMemoItem).not.toHaveBeenCalled()
      expect(mockUpdateMemoItem).toHaveBeenCalledTimes(1)
      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '1', order: 0 },
      ])
    })

    it('新規項目作成でエラーが発生した場合、エラー処理を行う', async () => {
      mockCreateMemoItem.mockResolvedValueOnce({
        success: false,
        error: '作成エラー',
      })

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(console.error).toHaveBeenCalledWith(
        'メモ項目の保存に失敗:',
        expect.any(Error)
      )
      expect(mockUpdateState).toHaveBeenCalledWith({ isSaving: false })
      expect(toast.error).toHaveBeenCalledWith(
        '⚠️ 保存中にエラーが発生しました',
        expect.objectContaining({
          description: '作成エラー',
          duration: 4000,
        })
      )
    })

    it('既存項目更新でエラーが発生した場合、エラー処理を行う', async () => {
      mockUpdateMemoItem.mockResolvedValueOnce({
        success: false,
        error: '更新エラー',
      })

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(toast.error).toHaveBeenCalledWith(
        '⚠️ 保存中にエラーが発生しました',
        expect.objectContaining({
          description: '更新エラー',
          duration: 4000,
        })
      )
    })

    it('順序更新でエラーが発生した場合、エラー処理を行う', async () => {
      mockBulkUpdateMemoItemOrder.mockResolvedValueOnce({
        success: false,
        error: '順序更新エラー',
      })

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(toast.error).toHaveBeenCalledWith(
        '⚠️ 保存中にエラーが発生しました',
        expect.objectContaining({
          description: '順序更新エラー',
          duration: 4000,
        })
      )
    })

    it('例外が発生した場合、デフォルトのエラーメッセージを表示する', async () => {
      mockCreateMemoItem.mockRejectedValueOnce('ネットワークエラー')

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      expect(toast.error).toHaveBeenCalledWith(
        '⚠️ 保存中にエラーが発生しました',
        expect.objectContaining({
          description: 'ネットワーク接続を確認してください',
          duration: 4000,
        })
      )
    })

    it('複雑な順序変更も正しく処理する', async () => {
      // 順序が入れ替わった状態
      mockState.items = [
        { ...mockState.items[2], order: 0 }, // id: 2
        { ...mockState.items[0], order: 1 }, // id: 1
        { ...mockState.items[1], order: 2 }, // id: temp-1
      ]

      const { result } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      await act(async () => {
        await result.current.handleSaveChanges()
      })

      // 元の配列の順序を維持することを確認
      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '2', order: 0 },
        { id: '1', order: 1 },
        { id: 'created-1', order: 2 },
      ])
    })
  })

  describe('関数の再生成', () => {
    it('依存配列の値が変わらない限り、関数は再生成されない', () => {
      const { result, rerender } = renderHook(() =>
        useSaveActions({
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
        })
      )

      const firstRender = result.current.handleSaveChanges

      // 同じpropsで再レンダリング
      rerender()

      expect(result.current.handleSaveChanges).toBe(firstRender)
    })
  })
})