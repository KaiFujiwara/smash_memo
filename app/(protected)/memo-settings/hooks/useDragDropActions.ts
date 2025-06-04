/**
 * ドラッグ&ドロップ操作のカスタムフック
 */

import { useCallback } from 'react'
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

  // ドラッグ終了
  const handleDragEnd = useCallback((result: DragDropResult) => {
    if (!result.destination || result.source.index === result.destination.index) {
      updateState({ draggingId: null })
      return
    }
    
    const currentItems = Array.from(state.items).sort((a, b) => a.order - b.order)
    const [movedItem] = currentItems.splice(result.source.index, 1)
    currentItems.splice(result.destination.index, 0, movedItem)
    
    const updatedItems = currentItems.map((item, index) => ({
      ...item,
      order: index,
      updatedAt: new Date().toISOString()
    }))
    
    updateState({ items: updatedItems })
    
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