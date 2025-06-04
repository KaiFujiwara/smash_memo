/**
 * メモ項目のCRUD操作とドラッグ&ドロップ機能のカスタムフック
 * ローカル編集モード：すべての変更をローカルで管理し、「変更を保存」でまとめて保存
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MemoItem, DragDropResult } from '@/types'
import type { MemoSettingsState } from '../types'
import { 
  createMemoItem,
  updateMemoItem,
  deleteMemoItem,
  bulkUpdateMemoItemOrder,
  getNextOrder
} from '@/services/memoItemService'

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
  const router = useRouter()

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
      
      console.log('📝 ローカルに項目追加:', newItem.name)
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
      
      console.log('✏️ ローカルで編集完了:', state.editingName.trim())
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
      
      console.log('🗑️ ローカルで削除完了:', id)
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('項目の削除に失敗しました')
    }
  }, [state.items, updateState])

  // ドラッグ&ドロップ
  const handleDragStart = useCallback((start: any) => {
    const itemId = start.draggableId.replace('memo-item-', '')
    console.log('🚀 ドラッグ開始:', { draggableId: start.draggableId, itemId })
    updateState({ draggingId: itemId })
  }, [updateState])

  const handleDragEnd = useCallback((result: DragDropResult) => {
    console.log('🏁 ドラッグ終了:', result)
    
    if (!result.destination || result.source.index === result.destination.index) {
      console.log('❌ ドラッグキャンセルまたは同じ位置')
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
    
    console.log('✅ ローカルで並び替え完了:', { 
      from: result.source.index, 
      to: result.destination.index,
      movedItem: movedItem.name,
      updatedOrders: updatedItems.map(item => ({ name: item.name, order: item.order }))
    })
    
    updateState({ items: updatedItems })
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateState({ draggingId: null })
      })
    })
  }, [state.items, updateState])

  // データベースに一括保存
  const handleSaveChanges = useCallback(async () => {
    updateState({ isSaving: true })
    
    try {
      console.log('💾 データベースに一括保存開始')
      
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
      
      console.log('✅ データベース保存完了')
      
    } catch (error) {
      console.error('💥 保存エラー:', error)
      updateState({ isSaving: false })
      toast.error('⚠️ 保存中にエラーが発生しました', {
        description: error instanceof Error ? error.message : 'ネットワーク接続を確認してください',
        duration: 4000,
      })
    }
  }, [state.items, state.forceUpdateCounter, updateState, resetInitialState])

  // 離脱先に適切にナビゲーションする関数
  const executeNavigation = useCallback((pendingNavigation: import('../types').PendingNavigation | null) => {
    console.log('🚀 ナビゲーション実行:', pendingNavigation)
    
    if (!pendingNavigation) {
      console.log('⚠️ 離脱先情報がありません、デフォルトの戻る動作')
      router.back()
      return
    }

    switch (pendingNavigation.type) {
      case 'back':
        console.log('📱 ブラウザの戻る実行')
        router.back()
        break
      case 'link':
        if (pendingNavigation.url) {
          console.log('🔗 リンク先に遷移:', pendingNavigation.url)
          router.push(pendingNavigation.url)
        } else {
          router.back()
        }
        break
      default:
        console.log('🏠 デフォルトの戻る動作')
        router.back()
        break
    }
  }, [router])

  // 離脱警告の処理
  const handleForceLeave = useCallback(() => {
    console.log('🚪 強制離脱を実行')
    setNavigating(true)
    updateState({ showUnsavedWarning: false })
    
    executeNavigation(state.pendingNavigation)
  }, [executeNavigation, state.pendingNavigation, setNavigating, updateState])

  const handleSaveAndLeave = useCallback(async () => {
    console.log('💾 保存して離脱を実行')
    
    try {
      // 先に離脱フラグを設定してイベントリスナーを無効化
      setNavigating(true)
      
      await handleSaveChanges()
      
      console.log('✅ 保存完了、ナビゲーション実行')
      
      // モーダルを閉じてからナビゲーション
      updateState({ showUnsavedWarning: false })
      
      // 少し遅延を入れてナビゲーション実行（モーダルアニメーションを待つ）
      setTimeout(() => {
        executeNavigation(state.pendingNavigation)
      }, 150)
      
    } catch (error) {
      console.error('保存エラー:', error)
      // 保存に失敗した場合は離脱フラグをリセット
      setNavigating(false)
      updateState({ showUnsavedWarning: true })
    }
  }, [handleSaveChanges, executeNavigation, state.pendingNavigation, setNavigating, updateState])

  return {
    handleAddItem,
    handleStartEditing,
    handleSaveEdit,
    handleDeleteItem,
    handleDragStart,
    handleDragEnd,
    handleSaveChanges,
    handleForceLeave,
    handleSaveAndLeave
  }
} 