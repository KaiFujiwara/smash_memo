/**
 * ドラッグ&ドロップ操作のカスタムフック
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { bulkUpdateMemoItemOrder } from '@/services/memoItemService'
import type { DragDropResult } from '@/types'
import type { MemoSettingsState } from '../types'

interface UseDragDropActionsProps {
  state: MemoSettingsState
  updateState: (updates: Partial<MemoSettingsState>) => void
}

export function useDragDropActions({
  state,
  updateState
}: UseDragDropActionsProps) {

  // ドラッグ開始
  const handleDragStart = useCallback((start: any) => {
    const itemId = start.draggableId.replace('memo-item-', '')
    updateState({ draggingId: itemId })
  }, [updateState])

  // ドラッグ終了（即座にDB保存）
  const handleDragEnd = useCallback(async (result: DragDropResult) => {
    if (!result.destination || result.source.index === result.destination.index) {
      updateState({ draggingId: null })
      return
    }
    
    const currentItems = Array.from(state.items).sort((a, b) => a.order - b.order)
    const [movedItem] = currentItems.splice(result.source.index, 1)
    currentItems.splice(result.destination.index, 0, movedItem)
    
    const updatedItems = currentItems.map((item, index) => ({
      ...item,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }))
    
    // 楽観的UI更新
    updateState({ items: updatedItems })
    
    // DBに順序を保存
    try {
      const orderUpdates = updatedItems.map(item => ({
        id: item.id,
        order: item.order
      }))
      
      const result = await bulkUpdateMemoItemOrder(orderUpdates)
      
      if (!result.success) {
        // 失敗したら元に戻す
        updateState({ items: state.items })
        throw new Error(result.error || '順序の更新に失敗しました')
      }
      
      toast.success('順序を更新しました')
    } catch (error) {
      toast.error('順序の更新に失敗しました')
    }
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateState({ draggingId: null })
      })
    })
  }, [state.items, updateState])

  return {
    handleDragStart,
    handleDragEnd
  }
} 