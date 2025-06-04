/**
 * データ取得処理のカスタムフック
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import { getMemoItems } from '@/services/memoItemService'
import type { MemoItem } from '@/types'
import type { MemoSettingsState } from '../types'

interface UseDataLoadingProps {
  isAuthenticated: boolean | undefined
  updateState: (updates: Partial<MemoSettingsState>) => void
  resetInitialState: (items: MemoItem[]) => void
}

export function useDataLoading({
  isAuthenticated,
  updateState,
  resetInitialState
}: UseDataLoadingProps) {

  useEffect(() => {
    async function loadMemoItems() {
      if (isAuthenticated === undefined) return
      
      try {
        const result = await getMemoItems()
        updateState({ items: result.items })
        resetInitialState(result.items)
      } catch (error) {
        console.error('メモ項目の取得に失敗:', error)
        toast.error('メモ項目の取得に失敗しました')
        updateState({ items: [] })
        resetInitialState([])
      } finally {
        updateState({ isLoading: false })
      }
    }
    
    loadMemoItems()
  }, [isAuthenticated, updateState, resetInitialState])
} 