/**
 * メモ項目のCRUD操作のカスタムフック
 * ハイブリッド保存モード：即座にDB保存（並び替え以外）
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { createMemoItem, updateMemoItem, deleteMemoItemCascade } from '@/services/memoItemService'
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

  // 項目追加（即座にDB保存）
  const handleAddItem = useCallback(async (name: string) => {
    updateState({ isAdding: true })
    
    try {
      const maxOrder = Math.max(0, ...state.items.map(item => item.order))
      
      // DBに保存
      const result = await createMemoItem({
        name: name.trim(),
        order: maxOrder + 1,
        visible: true
      })
      
      if (result.success && result.item) {
        // 成功したらローカル状態を更新
        updateState({ 
          items: [...state.items, result.item],
          newItemName: ''
        })
        toast.success('項目を追加しました')
      } else {
        throw new Error(result.error || '項目の追加に失敗しました')
      }
    } catch (error) {
      toast.error('項目の追加に失敗しました')
    } finally {
      updateState({ isAdding: false })
    }
  }, [state.items, updateState])

  // 編集開始
  const handleStartEditing = useCallback((item: MemoItem) => {
    updateState({ 
      editingId: item.id,
      editingName: item.name
    })
  }, [updateState])

  // 編集保存（即座にDB保存）
  const handleSaveEdit = useCallback(async () => {
    if (!state.editingId) return
    
    try {
      // DBに保存
      const result = await updateMemoItem({
        id: state.editingId,
        name: state.editingName.trim()
      })
      
      if (result.success && result.item) {
        // 成功したらローカル状態を更新
        updateState({ 
          items: state.items.map(item => 
            item.id === state.editingId ? result.item! : item
          ),
          editingId: null
        })
        toast.success('項目を更新しました')
      } else {
        throw new Error(result.error || '項目の更新に失敗しました')
      }
    } catch (error) {
      toast.error('項目の更新に失敗しました')
    }
  }, [state.editingId, state.editingName, state.items, updateState])

  // 項目削除（即座にDB保存 - カスケード削除）
  const handleDeleteItem = useCallback(async (id: string) => {
    // 削除対象の項目名を取得
    const targetItem = state.items.find(item => item.id === id)
    const itemName = targetItem?.name || '項目'
    
    // ブラウザ確認ダイアログ
    if (!window.confirm(`「${itemName}」を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
      return
    }

    try {
      // DBからカスケード削除（関連メモ内容も含む）
      const result = await deleteMemoItemCascade({ id })
      
      if (result.success) {
        // 成功したらローカル状態を更新
        updateState({ 
          items: state.items.filter(item => item.id !== id)
        })
        
        // 削除されたメモ内容数も表示
        const deletedCount = result.deletedMemoContentsCount || 0
        if (deletedCount > 0) {
          toast.success(`項目と関連する${deletedCount}件のメモを削除しました`)
        } else {
          toast.success('項目を削除しました')
        }
      } else {
        throw new Error(result.error || '項目の削除に失敗しました')
      }
    } catch (error) {
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