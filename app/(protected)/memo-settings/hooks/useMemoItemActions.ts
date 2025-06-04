/**
 * メモ項目操作の統合カスタムフック
 * 分割された各操作フックを統合して単一のインターフェースを提供
 */

import type { MemoItem } from '@/types'
import type { MemoSettingsState, PendingNavigation } from '../types'
import { useMemoActions } from './useMemoActions'
import { useDragDropActions } from './useDragDropActions'
import { useSaveActions } from './useSaveActions'
import { useNavigation } from '../../../hooks/common/useNavigation'

interface UseMemoItemActionsProps {
  state: MemoSettingsState
  updateState: (updates: Partial<MemoSettingsState>) => void
  resetInitialState: (items: MemoItem[]) => void
  setNavigating: (navigating: boolean) => void
}

export function useMemoItemActions({
  state,
  updateState,
  resetInitialState,
  setNavigating
}: UseMemoItemActionsProps) {

  // 各操作カテゴリのフックを使用
  const memoActions = useMemoActions({ state, updateState })
  const dragDropActions = useDragDropActions({ state, updateState })
  const saveActions = useSaveActions({ state, updateState, resetInitialState })
  const navigation = useNavigation({ 
    setNavigating, 
    updateState, 
    onSave: saveActions.handleSaveChanges 
  })

  // 統合されたインターフェースを返す
  return {
    // CRUD操作
    handleAddItem: memoActions.handleAddItem,
    handleStartEditing: memoActions.handleStartEditing,
    handleSaveEdit: memoActions.handleSaveEdit,
    handleDeleteItem: memoActions.handleDeleteItem,
    
    // ドラッグ&ドロップ
    handleDragStart: dragDropActions.handleDragStart,
    handleDragEnd: dragDropActions.handleDragEnd,
    
    // データベース保存
    handleSaveChanges: saveActions.handleSaveChanges,
    
    // ナビゲーション
    handleForceLeave: () => navigation.handleForceLeave(state.pendingNavigation),
    handleSaveAndLeave: () => navigation.handleSaveAndLeave(state.pendingNavigation)
  }
} 