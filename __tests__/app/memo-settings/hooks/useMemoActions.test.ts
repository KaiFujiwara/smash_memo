/**
 * useMemoActionsフックのテスト
 * ハイブリッド保存モード：即座にDB保存のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useMemoActions } from '@/app/(protected)/memo-settings/hooks/useMemoActions'
import { createMemoItem, updateMemoItem, deleteMemoItemCascade } from '@/services/memoItemService'
import { toast } from 'sonner'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'

// モック設定
jest.mock('@/services/memoItemService', () => ({
  createMemoItem: jest.fn(),
  updateMemoItem: jest.fn(),
  deleteMemoItemCascade: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockCreateMemoItem = createMemoItem as jest.MockedFunction<typeof createMemoItem>
const mockUpdateMemoItem = updateMemoItem as jest.MockedFunction<typeof updateMemoItem>
const mockDeleteMemoItemCascade = deleteMemoItemCascade as jest.MockedFunction<typeof deleteMemoItemCascade>

// window.confirmのモック
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

describe('useMemoActions - ハイブリッド保存モード', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock

  beforeEach(() => {
    mockState = {
      items: [
        { id: '1', name: '既存項目1', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '既存項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ],
      newItemName: '',
      editingId: null,
      editingName: '',
      isLoading: false,
      isSaving: false,
      isAdding: false,
      draggingId: null
    }

    mockUpdateState = jest.fn()

    // モック初期化
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true) // デフォルトで確認
  })

  describe('handleAddItem', () => {
    it('項目追加が成功した場合、即座にDBに保存し、ローカル状態を更新する', async () => {
      const newItem = {
        id: 'new-1',
        name: '新しい項目',
        order: 2,
        visible: true,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02'
      }

      mockCreateMemoItem.mockResolvedValueOnce({
        success: true,
        item: newItem
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleAddItem('新しい項目')
      })

      // DB保存が呼ばれることを確認
      expect(mockCreateMemoItem).toHaveBeenCalledWith({
        name: '新しい項目',
        order: 2,
        visible: true
      })

      // ローカル状態が更新されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [...mockState.items, newItem],
        newItemName: ''
      })

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalled()
    })

    it('項目追加が失敗した場合、エラーメッセージを表示する', async () => {
      mockCreateMemoItem.mockResolvedValueOnce({
        success: false,
        error: 'DB保存エラー'
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleAddItem('新しい項目')
      })

      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalled()

      // ローカル状態は更新されないことを確認
      expect(mockUpdateState).toHaveBeenCalledTimes(2) // isAdding: true, false のみ
    })
  })

  describe('handleSaveEdit', () => {
    beforeEach(() => {
      mockState.editingId = '1'
      mockState.editingName = '編集後の名前'
    })

    it('項目編集が成功した場合、即座にDBに保存し、ローカル状態を更新する', async () => {
      const updatedItem = {
        id: '1',
        name: '編集後の名前',
        order: 0,
        visible: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      }

      mockUpdateMemoItem.mockResolvedValueOnce({
        success: true,
        item: updatedItem
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      // DB更新が呼ばれることを確認
      expect(mockUpdateMemoItem).toHaveBeenCalledWith({
        id: '1',
        name: '編集後の名前'
      })

      // ローカル状態が更新されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [
          updatedItem,
          mockState.items[1]
        ],
        editingId: null
      })

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalled()
    })

    it('項目編集が失敗した場合、エラーメッセージを表示する', async () => {
      mockUpdateMemoItem.mockResolvedValueOnce({
        success: false,
        error: 'DB更新エラー'
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleSaveEdit()
      })

      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalled()

      // ローカル状態は更新されないことを確認（編集状態は保持）
      expect(mockUpdateState).not.toHaveBeenCalled()
    })
  })

  describe('handleDeleteItem', () => {
    it('項目削除が成功した場合、即座にDBから削除し、ローカル状態を更新する', async () => {
      mockDeleteMemoItemCascade.mockResolvedValueOnce({
        success: true,
        deletedMemoContentsCount: 0
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDeleteItem('1')
      })

      // DB削除が呼ばれることを確認
      expect(mockDeleteMemoItemCascade).toHaveBeenCalledWith({ id: '1' })

      // ローカル状態が更新されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [mockState.items[1]] // ID '1' の項目が削除される
      })

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalled()
    })

    it('項目削除が失敗した場合、エラーメッセージを表示する', async () => {
      mockDeleteMemoItemCascade.mockResolvedValueOnce({
        success: false,
        error: 'DB削除エラー'
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDeleteItem('1')
      })

      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalled()

      // ローカル状態は更新されないことを確認
      expect(mockUpdateState).not.toHaveBeenCalled()
    })

    it('関連するメモコンテンツがある場合、カスケード削除メッセージを表示する', async () => {
      mockDeleteMemoItemCascade.mockResolvedValueOnce({
        success: true,
        deletedMemoContentsCount: 3
      })

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDeleteItem('1')
      })

      // カスケード削除メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalled()
    })
  })

  describe('handleStartEditing', () => {
    it('編集開始時にローカル状態を設定する', () => {
      const item = mockState.items[0]

      const { result } = renderHook(() => useMemoActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      act(() => {
        result.current.handleStartEditing(item)
      })

      // 編集状態が設定されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        editingId: '1',
        editingName: '既存項目1'
      })
    })
  })
})