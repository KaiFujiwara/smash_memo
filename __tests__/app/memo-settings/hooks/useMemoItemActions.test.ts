/**
 * useMemoItemActionsフックのテスト
 * 各操作フックを統合するカスタムフックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useMemoItemActions } from '@/app/(protected)/memo-settings/hooks/useMemoItemActions'
import { useMemoActions } from '@/app/(protected)/memo-settings/hooks/useMemoActions'
import { useDragDropActions } from '@/app/(protected)/memo-settings/hooks/useDragDropActions'
import { useSaveActions } from '@/app/(protected)/memo-settings/hooks/useSaveActions'
import { useNavigation } from '@/app/hooks/common/useNavigation'
import type { MemoSettingsState } from '@/app/(protected)/memo-settings/types'

// 各フックをモック化
jest.mock('@/app/(protected)/memo-settings/hooks/useMemoActions')
jest.mock('@/app/(protected)/memo-settings/hooks/useDragDropActions')
jest.mock('@/app/(protected)/memo-settings/hooks/useSaveActions')
jest.mock('@/app/hooks/common/useNavigation')

describe('useMemoItemActions', () => {
  let mockState: MemoSettingsState
  let mockUpdateState: jest.Mock
  let mockResetInitialState: jest.Mock
  let mockSetNavigating: jest.Mock

  // モック化された各フックの戻り値
  const mockMemoActions = {
    handleAddItem: jest.fn(),
    handleStartEditing: jest.fn(),
    handleSaveEdit: jest.fn(),
    handleDeleteItem: jest.fn(),
  }

  const mockDragDropActions = {
    handleDragStart: jest.fn(),
    handleDragEnd: jest.fn(),
  }

  const mockSaveActions = {
    handleSaveChanges: jest.fn(),
  }

  const mockNavigation = {
    handleForceLeave: jest.fn(),
    handleSaveAndLeave: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // 初期状態のモック
    mockState = {
      items: [],
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
    mockResetInitialState = jest.fn()
    mockSetNavigating = jest.fn()

    // 各フックのモック実装
    ;(useMemoActions as jest.Mock).mockReturnValue(mockMemoActions)
    ;(useDragDropActions as jest.Mock).mockReturnValue(mockDragDropActions)
    ;(useSaveActions as jest.Mock).mockReturnValue(mockSaveActions)
    ;(useNavigation as jest.Mock).mockReturnValue(mockNavigation)
  })

  it('各フックを正しいパラメータで初期化する', () => {
    renderHook(() =>
      useMemoItemActions({
        state: mockState,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
        setNavigating: mockSetNavigating,
      })
    )

    // useMemoActionsが正しく呼ばれているか確認
    expect(useMemoActions).toHaveBeenCalledWith({
      state: mockState,
      updateState: mockUpdateState,
    })

    // useDragDropActionsが正しく呼ばれているか確認
    expect(useDragDropActions).toHaveBeenCalledWith({
      state: mockState,
      updateState: mockUpdateState,
    })

    // useSaveActionsが正しく呼ばれているか確認
    expect(useSaveActions).toHaveBeenCalledWith({
      state: mockState,
      updateState: mockUpdateState,
      resetInitialState: mockResetInitialState,
    })

    // useNavigationが正しく呼ばれているか確認
    expect(useNavigation).toHaveBeenCalledWith({
      setNavigating: mockSetNavigating,
      updateState: mockUpdateState,
      onSave: mockSaveActions.handleSaveChanges,
    })
  })

  it('統合されたインターフェースを正しく返す', () => {
    const { result } = renderHook(() =>
      useMemoItemActions({
        state: mockState,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
        setNavigating: mockSetNavigating,
      })
    )

    // CRUD操作が正しく公開されているか確認
    expect(result.current.handleAddItem).toBe(mockMemoActions.handleAddItem)
    expect(result.current.handleStartEditing).toBe(mockMemoActions.handleStartEditing)
    expect(result.current.handleSaveEdit).toBe(mockMemoActions.handleSaveEdit)
    expect(result.current.handleDeleteItem).toBe(mockMemoActions.handleDeleteItem)

    // ドラッグ&ドロップ操作が正しく公開されているか確認
    expect(result.current.handleDragStart).toBe(mockDragDropActions.handleDragStart)
    expect(result.current.handleDragEnd).toBe(mockDragDropActions.handleDragEnd)

    // 保存操作が正しく公開されているか確認
    expect(result.current.handleSaveChanges).toBe(mockSaveActions.handleSaveChanges)

    // ナビゲーション操作が関数として公開されているか確認
    expect(typeof result.current.handleForceLeave).toBe('function')
    expect(typeof result.current.handleSaveAndLeave).toBe('function')
  })

  it('handleForceLeaveが正しくpendingNavigationを渡す', () => {
    const pendingNav = {
      type: 'link' as const,
      url: '/dashboard',
      timestamp: Date.now(),
    }
    mockState.pendingNavigation = pendingNav

    const { result } = renderHook(() =>
      useMemoItemActions({
        state: mockState,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
        setNavigating: mockSetNavigating,
      })
    )

    result.current.handleForceLeave()

    expect(mockNavigation.handleForceLeave).toHaveBeenCalledWith(pendingNav)
  })

  it('handleSaveAndLeaveが正しくpendingNavigationを渡す', () => {
    const pendingNav = {
      type: 'external' as const,
      url: 'https://example.com',
      timestamp: Date.now(),
    }
    mockState.pendingNavigation = pendingNav

    const { result } = renderHook(() =>
      useMemoItemActions({
        state: mockState,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
        setNavigating: mockSetNavigating,
      })
    )

    result.current.handleSaveAndLeave()

    expect(mockNavigation.handleSaveAndLeave).toHaveBeenCalledWith(pendingNav)
  })

  it('pendingNavigationがnullの場合でもナビゲーション関数が呼び出せる', () => {
    mockState.pendingNavigation = null

    const { result } = renderHook(() =>
      useMemoItemActions({
        state: mockState,
        updateState: mockUpdateState,
        resetInitialState: mockResetInitialState,
        setNavigating: mockSetNavigating,
      })
    )

    // エラーなく実行できることを確認
    expect(() => result.current.handleForceLeave()).not.toThrow()
    expect(() => result.current.handleSaveAndLeave()).not.toThrow()

    expect(mockNavigation.handleForceLeave).toHaveBeenCalledWith(null)
    expect(mockNavigation.handleSaveAndLeave).toHaveBeenCalledWith(null)
  })

  it('propsが変更されても関数の参照が保持される', () => {
    const { result, rerender } = renderHook(
      (props) => useMemoItemActions(props),
      {
        initialProps: {
          state: mockState,
          updateState: mockUpdateState,
          resetInitialState: mockResetInitialState,
          setNavigating: mockSetNavigating,
        },
      }
    )

    const firstRender = { ...result.current }

    // stateの一部を変更して再レンダリング
    mockState.isLoading = true
    rerender({
      state: mockState,
      updateState: mockUpdateState,
      resetInitialState: mockResetInitialState,
      setNavigating: mockSetNavigating,
    })

    // 各関数の参照が変わっていないことを確認（各フックのモックが同じ関数を返すため）
    expect(result.current.handleAddItem).toBe(firstRender.handleAddItem)
    expect(result.current.handleStartEditing).toBe(firstRender.handleStartEditing)
    expect(result.current.handleSaveEdit).toBe(firstRender.handleSaveEdit)
    expect(result.current.handleDeleteItem).toBe(firstRender.handleDeleteItem)
    expect(result.current.handleDragStart).toBe(firstRender.handleDragStart)
    expect(result.current.handleDragEnd).toBe(firstRender.handleDragEnd)
    expect(result.current.handleSaveChanges).toBe(firstRender.handleSaveChanges)
  })
})