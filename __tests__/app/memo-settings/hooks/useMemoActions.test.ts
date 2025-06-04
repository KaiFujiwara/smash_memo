/**
 * useMemoActionsフックのテスト
 * メモ項目のCRUD操作（作成、読み取り、更新、削除）に関するローカル状態管理のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useMemoActions } from '@/app/(protected)/memo-settings/hooks/useMemoActions'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'
import type { MemoItem } from '@/types'

// sonnerのトーストをモック化
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('useMemoActions', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 初期状態のモック
    mockState = {
      items: [
        {
          id: '1',
          name: '既存項目1',
          order: 1,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: '既存項目2',
          order: 2,
          visible: true,
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
      nextTempId: 1,
      pendingNavigation: null,
    }

    mockUpdateState = jest.fn((updates) => {
      Object.assign(mockState, updates)
    })
  })

  describe('handleAddItem', () => {
    it('新しい項目を正常に追加できる', async () => {
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleAddItem('新規項目')
      })

      // isAddingがtrueに設定されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({ isAdding: true })

      // 新しい項目が追加されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'temp-1',
            name: '新規項目',
            order: 3, // 既存の最大order + 1
            visible: true,
          }),
        ]),
        newItemName: '',
        nextTempId: 2,
      })

      // isAddingがfalseに戻ることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({ isAdding: false })
    })

    it('空の項目リストに最初の項目を追加できる', async () => {
      mockState.items = []
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleAddItem('最初の項目')
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [
          expect.objectContaining({
            id: 'temp-1',
            name: '最初の項目',
            order: 1,
            visible: true,
          }),
        ],
        newItemName: '',
        nextTempId: 2,
      })
    })

    it('前後の空白を削除して項目を追加する', async () => {
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleAddItem('  空白あり項目  ')
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: '空白あり項目',
          }),
        ]),
        newItemName: '',
        nextTempId: 2,
      })
    })

    it('エラー発生時にトーストエラーを表示する', async () => {
      // エラーを発生させるためにmockUpdateStateでエラーを投げる
      let callCount = 0
      mockUpdateState.mockImplementation((updates) => {
        callCount++
        // 2回目の呼び出し（items更新時）でエラーを投げる
        if (callCount === 2) {
          throw new Error('追加エラー')
        }
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleAddItem('エラー項目')
      })

      expect(toast.error).toHaveBeenCalledWith('項目の追加に失敗しました')
      
      // エラー後もisAddingがfalseに戻ることを確認
      expect(mockUpdateState).toHaveBeenLastCalledWith({ isAdding: false })

      consoleSpy.mockRestore()
    })
  })

  describe('handleStartEditing', () => {
    it('編集モードを開始する', () => {
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      const itemToEdit = mockState.items[0]

      act(() => {
        result.current.handleStartEditing(itemToEdit)
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        editingId: '1',
        editingName: '既存項目1',
      })
    })
  })

  describe('handleSaveEdit', () => {
    it('編集中の項目を保存する', async () => {
      mockState.editingId = '1'
      mockState.editingName = '編集後の名前'

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: '編集後の名前',
            updatedAt: expect.any(String),
          }),
          expect.objectContaining({
            id: '2',
            name: '既存項目2', // 他の項目は変更されない
          }),
        ]),
        editingId: null,
      })
    })

    it('editingIdがnullの場合は何もしない', async () => {
      mockState.editingId = null

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      expect(mockUpdateState).not.toHaveBeenCalled()
    })

    it('編集時に前後の空白を削除する', async () => {
      mockState.editingId = '1'
      mockState.editingName = '  空白付き名前  '

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: '空白付き名前',
          }),
        ]),
        editingId: null,
      })
    })

    it('エラー発生時にトーストエラーを表示する', async () => {
      mockState.editingId = '1'
      mockState.editingName = 'エラー名前'

      mockUpdateState.mockImplementationOnce(() => {
        throw new Error('更新エラー')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      expect(toast.error).toHaveBeenCalledWith('項目の更新に失敗しました')

      consoleSpy.mockRestore()
    })
  })

  describe('handleDeleteItem', () => {
    it('指定された項目を削除する', async () => {
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteItem('1')
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: '2',
            name: '既存項目2',
          }),
        ]),
        showDeleteConfirm: null,
      })

      // 削除された項目が含まれていないことを確認
      const calledItems = mockUpdateState.mock.calls[0][0].items
      expect(calledItems).toHaveLength(1)
      expect(calledItems.find((item: MemoItem) => item.id === '1')).toBeUndefined()
    })

    it('存在しない項目IDを指定しても他の項目に影響しない', async () => {
      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteItem('999')
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        items: mockState.items, // 元の項目がそのまま残る
        showDeleteConfirm: null,
      })
    })

    it('エラー発生時にトーストエラーを表示する', async () => {
      mockUpdateState.mockImplementationOnce(() => {
        throw new Error('削除エラー')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      await act(async () => {
        await result.current.handleDeleteItem('1')
      })

      expect(toast.error).toHaveBeenCalledWith('項目の削除に失敗しました')

      consoleSpy.mockRestore()
    })
  })

  describe('関数の再生成', () => {
    it('依存配列の値が変わらない限り、関数は再生成されない', () => {
      const { result, rerender } = renderHook(() =>
        useMemoActions({ state: mockState, updateState: mockUpdateState })
      )

      const firstRender = {
        handleAddItem: result.current.handleAddItem,
        handleStartEditing: result.current.handleStartEditing,
        handleSaveEdit: result.current.handleSaveEdit,
        handleDeleteItem: result.current.handleDeleteItem,
      }

      // 同じpropsで再レンダリング
      rerender()

      expect(result.current.handleAddItem).toBe(firstRender.handleAddItem)
      expect(result.current.handleStartEditing).toBe(firstRender.handleStartEditing)
      expect(result.current.handleSaveEdit).toBe(firstRender.handleSaveEdit)
      expect(result.current.handleDeleteItem).toBe(firstRender.handleDeleteItem)
    })
  })
})