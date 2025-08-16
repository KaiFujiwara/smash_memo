/**
 * useDragDropActionsフックのテスト
 * ハイブリッド保存モード：ドラッグ完了時にDB保存のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useDragDropActions } from '@/app/(protected)/memo-settings/hooks/useDragDropActions'
import { bulkUpdateMemoItemOrder } from '@/services/memoItemService'
import { toast } from 'sonner'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'
import type { DragDropResult } from '@/types'

// モック設定
jest.mock('@/services/memoItemService', () => ({
  bulkUpdateMemoItemOrder: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// requestAnimationFrameのモック
global.requestAnimationFrame = jest.fn((callback) => {
  callback(0)
  return 0
})

const mockBulkUpdateMemoItemOrder = bulkUpdateMemoItemOrder as jest.MockedFunction<typeof bulkUpdateMemoItemOrder>

describe('useDragDropActions - ハイブリッド保存モード', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock

  beforeEach(() => {
    mockState = {
      items: [
        { id: '1', name: '項目1', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
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
  })

  describe('handleDragStart', () => {
    it('ドラッグ開始時にdraggingIdを設定する', () => {
      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      const start = {
        draggableId: 'memo-item-1',
        source: { index: 0, droppableId: 'memo-items' }
      }

      act(() => {
        result.current.handleDragStart(start)
      })

      expect(mockUpdateState).toHaveBeenCalledWith({
        draggingId: '1'
      })
    })
  })

  describe('handleDragEnd', () => {
    it('項目の移動が成功した場合、即座にDBに保存し、ローカル状態を更新する', async () => {
      // 項目2を最初の位置に移動するシナリオ
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-2',
        source: { index: 1, droppableId: 'memo-items' },
        destination: { index: 0, droppableId: 'memo-items' }
      }

      mockBulkUpdateMemoItemOrder.mockResolvedValueOnce({
        success: true
      })

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // ローカル状態が楽観的に更新されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [
          { ...mockState.items[1], order: 0, updatedAt: expect.any(String) }, // 項目2が最初
          { ...mockState.items[0], order: 1, updatedAt: expect.any(String) }, // 項目1が2番目
          { ...mockState.items[2], order: 2, updatedAt: expect.any(String) }  // 項目3が3番目
        ]
      })

      // DB更新が呼ばれることを確認
      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '2', order: 0 },
        { id: '1', order: 1 },
        { id: '3', order: 2 }
      ])

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalled()
    })

    it('項目の移動が失敗した場合、元の状態に戻しエラーメッセージを表示する', async () => {
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-2',
        source: { index: 1, droppableId: 'memo-items' },
        destination: { index: 0, droppableId: 'memo-items' }
      }

      mockBulkUpdateMemoItemOrder.mockResolvedValueOnce({
        success: false,
        error: 'DB更新エラー'
      })

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // 楽観的更新が最初に行われることを確認
      expect(mockUpdateState).toHaveBeenNthCalledWith(1, {
        items: expect.any(Array)
      })

      // 失敗時に元の状態に戻されることを確認
      expect(mockUpdateState).toHaveBeenNthCalledWith(2, {
        items: mockState.items
      })

      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalled()
    })

    it('移動先がない場合、何もしない', async () => {
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-1',
        source: { index: 0, droppableId: 'memo-items' },
        destination: null
      }

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // draggingIdのリセットのみ確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        draggingId: null
      })

      // DB操作は呼ばれないことを確認
      expect(mockBulkUpdateMemoItemOrder).not.toHaveBeenCalled()
    })

    it('同じ位置への移動の場合、何もしない', async () => {
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-1',
        source: { index: 0, droppableId: 'memo-items' },
        destination: { index: 0, droppableId: 'memo-items' }
      }

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // draggingIdのリセットのみ確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        draggingId: null
      })

      // DB操作は呼ばれないことを確認
      expect(mockBulkUpdateMemoItemOrder).not.toHaveBeenCalled()
    })

    it('最後の項目を最初に移動する', async () => {
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-3',
        source: { index: 2, droppableId: 'memo-items' },
        destination: { index: 0, droppableId: 'memo-items' }
      }

      mockBulkUpdateMemoItemOrder.mockResolvedValueOnce({
        success: true
      })

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // 項目3が最初に移動されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [
          { ...mockState.items[2], order: 0, updatedAt: expect.any(String) }, // 項目3が最初
          { ...mockState.items[0], order: 1, updatedAt: expect.any(String) }, // 項目1が2番目
          { ...mockState.items[1], order: 2, updatedAt: expect.any(String) }  // 項目2が3番目
        ]
      })

      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '3', order: 0 },
        { id: '1', order: 1 },
        { id: '2', order: 2 }
      ])
    })

    it('最初の項目を最後に移動する', async () => {
      const dragResult: DragDropResult = {
        draggableId: 'memo-item-1',
        source: { index: 0, droppableId: 'memo-items' },
        destination: { index: 2, droppableId: 'memo-items' }
      }

      mockBulkUpdateMemoItemOrder.mockResolvedValueOnce({
        success: true
      })

      const { result } = renderHook(() => useDragDropActions({
        state: mockState,
        updateState: mockUpdateState
      }))

      await act(async () => {
        await result.current.handleDragEnd(dragResult)
      })

      // 項目1が最後に移動されることを確認
      expect(mockUpdateState).toHaveBeenCalledWith({
        items: [
          { ...mockState.items[1], order: 0, updatedAt: expect.any(String) }, // 項目2が最初
          { ...mockState.items[2], order: 1, updatedAt: expect.any(String) }, // 項目3が2番目
          { ...mockState.items[0], order: 2, updatedAt: expect.any(String) }  // 項目1が最後
        ]
      })

      expect(mockBulkUpdateMemoItemOrder).toHaveBeenCalledWith([
        { id: '2', order: 0 },
        { id: '3', order: 1 },
        { id: '1', order: 2 }
      ])
    })
  })
})