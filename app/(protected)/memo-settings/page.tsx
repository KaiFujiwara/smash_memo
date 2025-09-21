/**
 * メモ項目設定ページ（リファクタリング版）
 * 
 * ユーザーが自分のメモ項目をカスタマイズできるページです。
 * 項目の追加、編集、削除、並び替えが可能です。
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import { Info } from 'lucide-react'
import jaTranslations from './locales/ja.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

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
import { getMemoContentsByItemId } from '@/services/memoContentService'
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
  
  // 言語検出と翻訳テキスト取得
  const { t } = useProtectedTranslations(jaTranslations, enTranslations, zhTranslations)

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
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ item: MemoItem; memoContentCount: number } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const updateState = useCallback((updates: Partial<MemoSettingsState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // === カスタムフック ===
  const validation = useMemoValidation({
    items: state.items,
    newItemName: state.newItemName,
    editingName: state.editingName,
    editingId: state.editingId,
    messages: {
      nameRequired: t.validation2.nameRequired,
      nameTooLong: t.validation2.nameTooLong,
      nameDuplicate: t.validation2.nameDuplicate
    }
  })

  const memoActions = useMemoActions({
    state,
    updateState,
    messages: {
      itemAdded: t.messages.itemAdded,
      itemAddError: t.messages.itemAddError,
      itemUpdated: t.messages.itemUpdated,
      itemUpdateError: t.messages.itemUpdateError,
      itemDeleted: t.messages.itemDeleted,
      itemDeletedWithMemos: t.messages.itemDeletedWithMemos,
      itemDeleteError: t.messages.itemDeleteError,
      item: t.fallback.item
    }
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
          toast.success(t.messages.itemDeletedWithMemos.replace('{count}', deletedCount.toString()))
        } else {
          toast.success(t.messages.itemDeleted)
        }
        setDeleteConfirm(null)
      } else {
        throw new Error(result.error || t.messages.itemDeleteError)
      }
    } catch (error) {
      toast.error(t.messages.itemDeleteError)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteConfirm, state.items, updateState])

  const dragActions = useDragDropActions({
    state,
    updateState,
    messages: {
      orderUpdated: t.messages.orderUpdated,
      orderUpdateError: t.messages.orderUpdateError
    }
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
        toast.error(t.messages.dataLoadError)
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
      {/* 説明文 */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {t.info.description}
          </p>
        </div>
      </div>

      {/* 新規項目の追加 */}
      <AddNewItemSection
        newItemName={state.newItemName}
        itemsCount={state.items.length}
        isAdding={state.isAdding}
        validation={validation.newItemValidation}
        onNameChange={(name) => updateState({ newItemName: name })}
        onAddItem={handleAddNewItem}
        addSection={{
          title: t.addSection.title,
          placeholder: t.addSection.placeholder,
          itemsCount: t.addSection.itemsCount,
          limitReached: t.addSection.limitReached,
          addButton: t.addSection.addButton,
          adding: t.addSection.adding
        }}
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
        onDeleteConfirm={async (item) => {
          try {
            const memoContents = await getMemoContentsByItemId(item.id)
            setDeleteConfirm({ item, memoContentCount: memoContents.length })
          } catch (error) {
            setDeleteConfirm({ item, memoContentCount: 0 })
          }
        }}
        tooltip={{
          editDisabled: t.tooltip.editDisabled,
          dragToReorder: t.tooltip.dragToReorder,
          edit: t.tooltip.edit,
          delete: t.tooltip.delete
        }}
        itemsList={{
          title: t.itemsList.title,
          dragHint: t.itemsList.dragHint,
          empty: t.itemsList.empty,
          emptyHint: t.itemsList.emptyHint
        }}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={t.dialog.deleteTitle}
        message={t.dialog.deleteMessage
          .replace('{itemName}', deleteConfirm?.item.name || '')
          .replace('{memoCount}', (deleteConfirm?.memoContentCount || 0).toString())
        }
        confirmText={t.dialog.confirmText}
        cancelText={t.dialog.cancelText}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
} 