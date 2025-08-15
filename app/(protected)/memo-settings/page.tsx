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

// Custom Hooks
import { useMemoValidation } from './hooks/useMemoValidation'
import { useMemoActions } from './hooks/useMemoActions'
import { useDragDropActions } from './hooks/useDragDropActions'
import { useEffect } from 'react'
import { getMemoItems } from '@/services/memoItemService'
import { toast } from 'sonner'

// Components
import { AddNewItemSection } from './components/AddNewItemSection'
import { MemoItemsList } from './components/MemoItemsList'
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
        onDeleteConfirm={memoActions.handleDeleteItem}
      />

    </div>
  )
} 