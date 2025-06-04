/**
 * メモ項目設定ページ（リファクタリング版）
 * 
 * ユーザーが自分のメモ項目をカスタマイズできるページです。
 * 項目の追加、編集、削除、並び替えが可能です。
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { getMemoItems } from '@/services/memoItemService'

// Types and Utils
import type { MemoSettingsState } from './types'
import { MAX_ITEMS_COUNT } from './types'

// Custom Hooks
import { useMemoValidation } from './hooks/useMemoValidation'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { useMemoItemActions } from './hooks/useMemoItemActions'

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
    showShortcuts: false,
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

  // === 計算されたプロパティ ===
  const isMaxItemsReached = useMemo(() => 
    state.items.length >= MAX_ITEMS_COUNT, 
    [state.items.length]
  )

  // === キーボードショートカット ===
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        updateState({ showShortcuts: !state.showShortcuts })
        return
      }
      
      if (e.key === 'Escape') {
        if (state.showUnsavedWarning) {
          updateState({ showUnsavedWarning: false })
          return
        }
        if (state.showShortcuts) {
          updateState({ showShortcuts: false })
          return
        }
        if (state.showDeleteConfirm) {
          updateState({ showDeleteConfirm: null })
          return
        }
        if (state.editingId) {
          updateState({ editingId: null })
          return
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (state.editingId) {
          actions.handleSaveEdit()
        } else if (unsavedChanges.hasUnsavedChanges) {
          actions.handleSaveChanges()
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.showShortcuts, state.showUnsavedWarning, state.showDeleteConfirm, state.editingId, unsavedChanges.hasUnsavedChanges, actions, updateState])

  // === データ取得 ===
  useEffect(() => {
    async function loadMemoItems() {
      if (isAuthenticated === undefined) return
      
      try {
        console.log('📥 データベースからメモ項目を取得中...')
        const result = await getMemoItems()
        console.log('📥 取得完了:', result.items.length, '項目')
        
        updateState({ items: result.items })
        
        // 取得したデータを初期状態として設定
        console.log('🔧 初期状態を設定:', result.items.length, '項目')
        unsavedChanges.resetInitialState(result.items)
      } catch (error) {
        console.error('メモ項目の取得に失敗:', error)
        toast.error('メモ項目の取得に失敗しました')
        updateState({ items: [] })
        unsavedChanges.resetInitialState([])
      } finally {
        updateState({ isLoading: false })
      }
    }
    
    loadMemoItems()
  }, [isAuthenticated, updateState, unsavedChanges.resetInitialState])

  // === 初期データ設定の確認 ===
  useEffect(() => {
    if (!state.isLoading) {
      console.log('🔍 ページロード完了時の状態確認:', {
        itemsCount: state.items.length,
        hasUnsavedChanges: unsavedChanges.hasUnsavedChanges,
        forceUpdateCounter: state.forceUpdateCounter
      })
    }
  }, [state.isLoading, state.items.length, unsavedChanges.hasUnsavedChanges, state.forceUpdateCounter])

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
        onShowShortcuts={() => updateState({ showShortcuts: true })}
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

      {/* 項目リスト */}
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

      {/* ダイアログ群 */}
      <MemoDialogs
        showUnsavedWarning={state.showUnsavedWarning}
        showShortcuts={state.showShortcuts}
        showDeleteConfirm={state.showDeleteConfirm}
        isSaving={state.isSaving}
        onSaveAndLeave={actions.handleSaveAndLeave}
        onForceLeave={actions.handleForceLeave}
        onCloseUnsavedWarning={() => updateState({ showUnsavedWarning: false })}
        onCloseShortcuts={() => updateState({ showShortcuts: false })}
        onConfirmDelete={actions.handleDeleteItem}
        onCancelDelete={() => updateState({ showDeleteConfirm: null })}
      />
    </div>
  )
} 