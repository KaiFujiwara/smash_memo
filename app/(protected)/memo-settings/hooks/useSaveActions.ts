/**
 * データベース保存操作のカスタムフック
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { MemoItem } from '@/types'
import type { MemoSettingsState } from '../types'
import { 
  createMemoItem,
  updateMemoItem,
  bulkUpdateMemoItemOrder,
  getNextOrder
} from '@/services/memoItemService'

interface UseSaveActionsProps {
  state: MemoSettingsState
  updateState: (updates: Partial<MemoSettingsState>) => void
  resetInitialState: (items: MemoItem[]) => void
}

export function useSaveActions({
  state,
  updateState,
  resetInitialState
}: UseSaveActionsProps) {

  // データベースに一括保存
  const handleSaveChanges = useCallback(async () => {
    updateState({ isSaving: true })
    
    try {
      // 新規項目（tempIdを持つ）を作成
      const newItems = state.items.filter(item => item.id.startsWith('temp-'))
      const existingItems = state.items.filter(item => !item.id.startsWith('temp-'))
      
      // 1. 新規項目を作成
      const createdItems: MemoItem[] = []
      for (const item of newItems) {
        const order = await getNextOrder()
        const result = await createMemoItem({
          name: item.name,
          order,
          visible: item.visible
        })
        
        if (result.success && result.item) {
          createdItems.push(result.item)
        } else {
          throw new Error(result.error || '新規項目の作成に失敗')
        }
      }
      
      // 2. 既存項目を更新（名前変更）
      for (const item of existingItems) {
        const result = await updateMemoItem({
          id: item.id,
          name: item.name
        })
        
        if (!result.success) {
          throw new Error(result.error || '項目の更新に失敗')
        }
      }
      
      // 3. 全項目の順序を更新
      const allItems = [...existingItems, ...createdItems]
      const sortedItems = allItems.sort((a, b) => {
        const aIndex = state.items.findIndex(item => 
          item.id === a.id || (item.id.startsWith('temp-') && item.name === a.name)
        )
        const bIndex = state.items.findIndex(item => 
          item.id === b.id || (item.id.startsWith('temp-') && item.name === b.name)
        )
        return aIndex - bIndex
      })
      
      const orderUpdates = sortedItems.map((item, index) => ({
        id: item.id,
        order: index
      }))
      
      const orderResult = await bulkUpdateMemoItemOrder(orderUpdates)
      if (!orderResult.success) {
        throw new Error(orderResult.error || '順序の更新に失敗')
      }
      
      // 4. ローカル状態を更新
      const finalItems = sortedItems.map((item, index) => ({
        ...item,
        order: index
      }))
      
      updateState({ 
        items: finalItems,
        isSaving: false,
        forceUpdateCounter: state.forceUpdateCounter + 1,
        nextTempId: 1 // リセット
      })
      
      resetInitialState(finalItems)
      
      toast.success('🎉 メモ項目の設定を保存しました！', {
        description: '変更内容がデータベースに反映されました',
        duration: 2500,
      })
      
    } catch (error) {
      console.error('メモ項目の保存に失敗:', error)
      updateState({ isSaving: false })
      toast.error('⚠️ 保存中にエラーが発生しました', {
        description: error instanceof Error ? error.message : 'ネットワーク接続を確認してください',
        duration: 4000,
      })
    }
  }, [state.items, state.forceUpdateCounter, updateState, resetInitialState])

  return {
    handleSaveChanges
  }
} 