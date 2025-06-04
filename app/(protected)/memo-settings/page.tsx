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
import { useUnsavedChanges } from '../../hooks/common/useUnsavedChanges'
import { useMemoItemActions } from './hooks/useMemoItemActions'
import { useDataLoading } from './hooks/useDataLoading'

// Components
import { MemoSettingsHeader } from './components/MemoSettingsHeader'
import { AddNewItemSection } from './components/AddNewItemSection'
import { MemoItemsList } from './components/MemoItemsList'
import { MemoDialogs } from './components/MemoDialogs'

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
    showDeleteConfirm: null,
    showUnsavedWarning: false,
    draggingId: null,
    forceUpdateCounter: 0,
    // ローカル編集用の新しい状態
    pendingChanges: [],
    nextTempId: 1,
    // 離脱先情報
    pendingNavigation: null,
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

  const unsavedChanges = useUnsavedChanges({
    items: state.items,
    forceUpdateCounter: state.forceUpdateCounter,
    updateState
  })

  const actions = useMemoItemActions({
    state,
    updateState,
    resetInitialState: unsavedChanges.resetInitialState,
    setNavigating: unsavedChanges.setNavigating
  })

  // データ取得
  useDataLoading({
    isAuthenticated,
    updateState,
    resetInitialState: unsavedChanges.resetInitialState
  })

  // === 計算されたプロパティ ===
  const isMaxItemsReached = useMemo(() => 
    state.items.length >= MAX_ITEMS_COUNT, 
    [state.items.length]
  )

  // === イベントハンドラー ===
  const handleAddNewItem = useCallback(() => {
    if (validation.newItemValidation.isValid && !isMaxItemsReached) {
      actions.handleAddItem(state.newItemName)
    }
  }, [validation.newItemValidation.isValid, isMaxItemsReached, state.newItemName, actions])

  // === レンダリング ===
  if (state.isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <MemoSettingsHeader
        hasUnsavedChanges={unsavedChanges.hasUnsavedChanges}
        isSaving={state.isSaving}
        onSave={actions.handleSaveChanges}
      />

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
        onDragStart={actions.handleDragStart}
        onDragEnd={actions.handleDragEnd}
        onStartEditing={actions.handleStartEditing}
        onSaveEdit={actions.handleSaveEdit}
        onCancelEdit={() => updateState({ editingId: null })}
        onEditingNameChange={(name) => updateState({ editingName: name })}
        onDeleteConfirm={(id) => updateState({ showDeleteConfirm: id })}
      />

      {/* モーダルダイアログ */}
      <MemoDialogs
        showDeleteConfirm={state.showDeleteConfirm}
        showUnsavedWarning={state.showUnsavedWarning}
        isSaving={state.isSaving}
        onConfirmDelete={(id: string) => {
          actions.handleDeleteItem(id)
          updateState({ showDeleteConfirm: null })
        }}
        onCancelDelete={() => updateState({ showDeleteConfirm: null })}
        onForceLeave={actions.handleForceLeave}
        onSaveAndLeave={actions.handleSaveAndLeave}
        onCloseUnsavedWarning={() => updateState({ showUnsavedWarning: false })}
      />
    </div>
  )
} 