/**
 * useDragDropActionsフックのテスト
 * メモ項目のドラッグ&ドロップによる並び替え処理のテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useDragDropActions } from '@/app/(protected)/memo-settings/hooks/useDragDropActions'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'
import type { DragDropResult } from '@/types'

// requestAnimationFrameのモック
global.requestAnimationFrame = jest.fn((callback) => {
  callback(0)
  return 0
})

describe('useDragDropActions', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 初期状態のモック
    mockState = {
      items: [
        {
          id: '1',
          name: '項目1',
          order: 0,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: '項目2',
          order: 1,
          visible: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '3',
          name: '項目3',
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

    mockUpdateState = jest.fn()
  })

  describe('handleDragStart', () => {
    it('ドラッグ開始時にdraggingIdを設定する', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragStartEvent = {
        draggableId: 'memo-item-2',
      }

      act(() => {
        result.current.handleDragStart(dragStartEvent)
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ draggingId: '2' })
    })

    it('draggableIdプレフィックスを正しく削除する', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragStartEvent = {
        draggableId: 'memo-item-temp-123',
      }

      act(() => {
        result.current.handleDragStart(dragStartEvent)
      })

      expect(mockUpdateState).toHaveBeenCalledWith({ draggingId: 'temp-123' })
    })
  })

  describe('handleDragEnd', () => {
    it('項目を正常に並び替える（上から下へ）', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-1',
        type: 'DEFAULT',
        source: { index: 0, droppableId: 'memo-list' },
        destination: { index: 2, droppableId: 'memo-list' },
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      // 並び替え後の項目を確認
      const updatedItemsCall = mockUpdateState.mock.calls.find(
        call => call[0].items !== undefined
      )
      const updatedItems = updatedItemsCall[0].items

      expect(updatedItems).toHaveLength(3)
      expect(updatedItems[0].id).toBe('2') // 元2番目
      expect(updatedItems[1].id).toBe('3') // 元3番目
      expect(updatedItems[2].id).toBe('1') // 元1番目（移動した項目）

      // orderが正しく更新されることを確認
      expect(updatedItems[0].order).toBe(0)
      expect(updatedItems[1].order).toBe(1)
      expect(updatedItems[2].order).toBe(2)

      // updatedAtが更新されることを確認
      updatedItems.forEach((item: any) => {
        expect(item.updatedAt).not.toBe('2024-01-01T00:00:00.000Z')
      })
    })

    it('項目を正常に並び替える（下から上へ）', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-3',
        type: 'DEFAULT',
        source: { index: 2, droppableId: 'memo-list' },
        destination: { index: 0, droppableId: 'memo-list' },
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      const updatedItemsCall = mockUpdateState.mock.calls.find(
        call => call[0].items !== undefined
      )
      const updatedItems = updatedItemsCall[0].items

      expect(updatedItems[0].id).toBe('3') // 移動した項目
      expect(updatedItems[1].id).toBe('1') // 元1番目
      expect(updatedItems[2].id).toBe('2') // 元2番目
    })

    it('destinationがない場合は何もしない', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-1',
        type: 'DEFAULT',
        source: { index: 0, droppableId: 'memo-list' },
        destination: null,
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      // draggingIdだけnullに設定される
      expect(mockUpdateState).toHaveBeenCalledTimes(1)
      expect(mockUpdateState).toHaveBeenCalledWith({ draggingId: null })
    })

    it('同じ位置にドロップした場合は何もしない', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-1',
        type: 'DEFAULT',
        source: { index: 1, droppableId: 'memo-list' },
        destination: { index: 1, droppableId: 'memo-list' },
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      // draggingIdだけnullに設定される
      expect(mockUpdateState).toHaveBeenCalledTimes(1)
      expect(mockUpdateState).toHaveBeenCalledWith({ draggingId: null })
    })

    it('requestAnimationFrameを使用してdraggingIdをリセットする', () => {
      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-1',
        type: 'DEFAULT',
        source: { index: 0, droppableId: 'memo-list' },
        destination: { index: 2, droppableId: 'memo-list' },
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      // requestAnimationFrameが2回呼ばれることを確認
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2)

      // draggingIdがnullに設定されることを確認
      const draggingIdResetCall = mockUpdateState.mock.calls.find(
        call => call[0].draggingId === null
      )
      expect(draggingIdResetCall).toBeDefined()
    })

    it('orderが異なる場合も正しくソートして並び替える', () => {
      // orderがバラバラな状態を作る
      mockState.items = [
        { ...mockState.items[0], order: 5 },
        { ...mockState.items[1], order: 3 },
        { ...mockState.items[2], order: 7 },
      ]

      const { result } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const dragEndResult: DragDropResult = {
        draggableId: 'memo-item-2',
        type: 'DEFAULT',
        source: { index: 0, droppableId: 'memo-list' }, // ソート後の位置
        destination: { index: 2, droppableId: 'memo-list' },
      }

      act(() => {
        result.current.handleDragEnd(dragEndResult)
      })

      const updatedItemsCall = mockUpdateState.mock.calls.find(
        call => call[0].items !== undefined
      )
      const updatedItems = updatedItemsCall[0].items

      // ソート後の正しい順序になっていることを確認
      expect(updatedItems[0].id).toBe('1')
      expect(updatedItems[1].id).toBe('3')
      expect(updatedItems[2].id).toBe('2')
    })
  })

  describe('関数の再生成', () => {
    it('依存配列の値が変わらない限り、関数は再生成されない', () => {
      const { result, rerender } = renderHook(() =>
        useDragDropActions({ state: mockState, updateState: mockUpdateState })
      )

      const firstRender = {
        handleDragStart: result.current.handleDragStart,
        handleDragEnd: result.current.handleDragEnd,
      }

      // 同じpropsで再レンダリング
      rerender()

      expect(result.current.handleDragStart).toBe(firstRender.handleDragStart)
      expect(result.current.handleDragEnd).toBe(firstRender.handleDragEnd)
    })
  })
})