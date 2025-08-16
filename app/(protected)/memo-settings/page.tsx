/**
 * メモ項目設定ページ（リファクタリング版）
 * 
 * ユーザーが自分のメモ項目をカスタマイズできるページです。
 * 項目の追加、編集、削除、並び替えが可能です。
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Types and Utils
import type { MemoSettingsState } from './types'
import { MAX_ITEMS_COUNT } from './types'
import type { MemoItem } from '@/types'

// Custom Hooks
import { useMemoValidation } from './hooks/useMemoValidation'
import { useMemoActions } from './hooks/useMemoActions'
import { useDragDropActions } from './hooks/useDragDropActions'
import { useEffect } from 'react'
import { getMemoItems, deleteMemoItemCascade } from '@/services/memoItemService'
import { toast } from 'sonner'

// Components
import { AddNewItemSection } from './components/AddNewItemSection'
import { MemoItemsList } from './components/MemoItemsList'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Loading from '@/app/loading'

/**
 * メモ設定ページのメインコンポーネント
 */
export default function MemoSettingsPage() {
  const { isAuthenticated } = useAuth()

  // === 状態管理 ===
  const [state, setState] = useState<MemoSettingsState>({
    items: [],
    newItemName: '',
    editingId: null,
    editingName: '',
    isLoading: true,
    isSaving: false,
    isAdding: false,
    draggingId: null,
  })
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ item: MemoItem } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const updateState = useCallback((updates: Partial<MemoSettingsState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // === カスタムフック ===
  const validation = useMemoValidation({
    items: state.items,
    newItemName: state.newItemName,
    editingName: state.editingName,
    editingId: state.editingId
  })

  const memoActions = useMemoActions({
    state,
    updateState
  })
  
  // カスタムダイアログ用の削除処理
  const handleDeleteItem = useCallback(async () => {
    if (!deleteConfirm) return
    
    setIsDeleting(true)
    try {
      // DBからカスケード削除（関連メモ内容も含む）
      const result = await deleteMemoItemCascade({ id: deleteConfirm.item.id })
      
      if (result.success) {
        // 成功したらローカル状態を更新
        updateState({ 
          items: state.items.filter(item => item.id !== deleteConfirm.item.id)
        })
        
        // 削除されたメモ内容数も表示
        const deletedCount = result.deletedMemoContentsCount || 0
        if (deletedCount > 0) {
          toast.success(`項目と関連する${deletedCount}件のメモを削除しました`)
        } else {
          toast.success('項目を削除しました')
        }
        setDeleteConfirm(null)
      } else {
        throw new Error(result.error || '項目の削除に失敗しました')
      }
    } catch (error) {
      toast.error('項目の削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteConfirm, state.items, updateState])

  const dragActions = useDragDropActions({
    state,
    updateState
  })

  // データ取得
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        const result = await getMemoItems()
        updateState({ 
          items: result.items || [],
          isLoading: false 
        })
      } catch (error) {
        updateState({ 
          items: [],
          isLoading: false 
        })
        toast.error('データの取得に失敗しました')
      }
    }

    fetchData()
  }, [isAuthenticated, updateState])

  // === 計算されたプロパティ ===
  const isMaxItemsReached = useMemo(() => 
    state.items.length >= MAX_ITEMS_COUNT, 
    [state.items.length]
  )

  // === イベントハンドラー ===
  const handleAddNewItem = useCallback(() => {
    if (validation.newItemValidation.isValid && !isMaxItemsReached) {
      memoActions.handleAddItem(state.newItemName)
    }
  }, [validation.newItemValidation.isValid, isMaxItemsReached, state.newItemName, memoActions])

  // === レンダリング ===
  if (state.isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-4">
      {/* 新規項目の追加 */}
      <AddNewItemSection
        newItemName={state.newItemName}
        itemsCount={state.items.length}
        isAdding={state.isAdding}
        validation={validation.newItemValidation}
        onNameChange={(name) => updateState({ newItemName: name })}
        onAddItem={handleAddNewItem}
      />

      {/* メモ項目一覧 */}
      <MemoItemsList
        items={state.items}
        editingId={state.editingId}
        editingName={state.editingName}
        editingValidation={validation.editingValidation}
        draggingId={state.draggingId}
        onDragStart={dragActions.handleDragStart}
        onDragEnd={dragActions.handleDragEnd}
        onStartEditing={memoActions.handleStartEditing}
        onSaveEdit={memoActions.handleSaveEdit}
        onCancelEdit={() => updateState({ editingId: null })}
        onEditingNameChange={(name) => updateState({ editingName: name })}
        onDeleteConfirm={(item) => setDeleteConfirm({ item })}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="メモ項目の削除"
        message={`「${deleteConfirm?.item.name}」を削除してもよろしいですか？\nこの操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
} 