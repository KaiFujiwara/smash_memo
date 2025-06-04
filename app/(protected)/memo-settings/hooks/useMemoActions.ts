/**
 * メモ項目のCRUD操作のカスタムフック
 * ローカル編集モード：すべての変更をローカルで管理
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { MemoItem } from '@/types'
import type { MemoSettingsState } from '../types'

interface UseMemoActionsProps {
  state: MemoSettingsState
  updateState: (updates: Partial<MemoSettingsState>) => void
}

export function useMemoActions({
  state,
  updateState
}: UseMemoActionsProps) {

  // ローカル項目追加
  const handleAddItem = useCallback(async (name: string) => {
    updateState({ isAdding: true })
    
    try {
      // 一時IDを使用してローカルに追加
      const tempId = `temp-${state.nextTempId}`
      const maxOrder = Math.max(0, ...state.items.map(item => item.order))
      
      const newItem: MemoItem = {
        id: tempId,
        name: name.trim(),
        order: maxOrder + 1,
        visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      updateState({ 
        items: [...state.items, newItem],
        newItemName: '',
        nextTempId: state.nextTempId + 1
      })
    } catch (error) {
      console.error('項目追加エラー:', error)
      toast.error('項目の追加に失敗しました')
    } finally {
      updateState({ isAdding: false })
    }
  }, [state.items, state.nextTempId, updateState])

  // 編集開始
  const handleStartEditing = useCallback((item: MemoItem) => {
    updateState({ 
      editingId: item.id,
      editingName: item.name
    })
  }, [updateState])

  // ローカル編集保存
  const handleSaveEdit = useCallback(async () => {
    if (!state.editingId) return
    
    try {
      // ローカルで項目名を更新
      updateState({ 
        items: state.items.map(item => 
          item.id === state.editingId 
            ? { ...item, name: state.editingName.trim(), updatedAt: new Date().toISOString() } 
            : item
        ),
        editingId: null
      })
    } catch (error) {
      console.error('編集エラー:', error)
      toast.error('項目の更新に失敗しました')
    }
  }, [state.editingId, state.editingName, state.items, updateState])

  // ローカル項目削除
  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      updateState({ 
        items: state.items.filter(item => item.id !== id),
        showDeleteConfirm: null
      })
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('項目の削除に失敗しました')
    }
  }, [state.items, updateState])

  return {
    handleAddItem,
    handleStartEditing,
    handleSaveEdit,
    handleDeleteItem
  }
} 