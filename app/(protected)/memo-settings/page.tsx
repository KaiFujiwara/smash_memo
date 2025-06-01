/**
 * メモ項目設定ページ
 * 
 * ユーザーが自分のメモ項目をカスタマイズできるページです。
 * 項目の追加、編集、削除、並び替えが可能です。
 * 
 * 機能:
 * - ドラッグ&ドロップによる順序変更
 * - バリデーション（重複チェック、文字数制限）
 * - キーボードショートカット対応
 * - リアルタイム入力検証
 * - 楽観的UI更新
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Grip, X, Edit2, Save, AlertTriangle, Settings, ArrowDown, Info, Keyboard } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'

import type { MemoItem, DragDropResult } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { 
  getMemoItems,
  createMemoItem,
  updateMemoItem,
  deleteMemoItem,
  bulkUpdateMemoItemOrder,
  getNextOrder
} from '@/services/memoItemService'

// === 定数定義 ===

const MAX_ITEM_NAME_LENGTH = 20
const MIN_ITEM_NAME_LENGTH = 1
const MAX_ITEMS_COUNT = 20

// === 型定義 ===

interface MemoSettingsState {
  items: MemoItem[]
  newItemName: string
  editingId: string | null
  editingName: string
  isLoading: boolean
  isSaving: boolean
  isAdding: boolean
  showDeleteConfirm: string | null
  showShortcuts: boolean
  draggingId: string | null
}

// === ヘルパー関数 ===

/**
 * デモデータの生成
 */
function generateDemoData(): MemoItem[] {
  return [
    { id: 'demo-1', name: '立ち回り', order: 0, visible: true },
    { id: 'demo-2', name: '崖狩り', order: 1, visible: true },
    { id: 'demo-3', name: '復帰阻止', order: 2, visible: true },
    { id: 'demo-4', name: 'コンボ', order: 3, visible: true },
    { id: 'demo-5', name: 'キル確', order: 4, visible: true },
    { id: 'demo-6', name: '注意点', order: 5, visible: true },
  ]
}

/**
 * メモ設定ページのメインコンポーネント
 */
export default function MemoSettingsPage() {
  // === 認証状態 ===
  const { user, isAuthenticated } = useAuth()

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
    draggingId: null,
  })

  // === バリデーション関数 ===

  const isDuplicateName = useCallback((name: string, excludeId?: string) => {
    return state.items.some(item => 
      item.id !== excludeId && 
      item.name.toLowerCase().trim() === name.toLowerCase().trim()
    )
  }, [state.items])

  const validateItemName = useCallback((name: string, excludeId?: string) => {
    const trimmedName = name.trim()
    
    if (trimmedName.length < MIN_ITEM_NAME_LENGTH) {
      return { isValid: false, error: '項目名を入力してください' }
    }
    
    if (trimmedName.length > MAX_ITEM_NAME_LENGTH) {
      return { isValid: false, error: `項目名は${MAX_ITEM_NAME_LENGTH}文字以内で入力してください` }
    }
    
    if (isDuplicateName(trimmedName, excludeId)) {
      return { isValid: false, error: 'この項目名は既に存在します' }
    }
    
    return { isValid: true, error: null }
  }, [isDuplicateName])

  // === 計算されたプロパティ ===

  const newItemValidation = useMemo(() => 
    validateItemName(state.newItemName), 
    [state.newItemName, validateItemName]
  )

  const editingValidation = useMemo(() => 
    state.editingId ? validateItemName(state.editingName, state.editingId) : { isValid: true, error: null },
    [state.editingName, state.editingId, validateItemName]
  )

  const isMaxItemsReached = useMemo(() => 
    state.items.length >= MAX_ITEMS_COUNT, 
    [state.items.length]
  )

  // === イベントハンドラー ===

  const updateState = useCallback((updates: Partial<MemoSettingsState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // === キーボードショートカット ===

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        updateState({ showShortcuts: !state.showShortcuts })
        return
      }
      
      if (e.key === 'Escape') {
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
          handleSaveEdit()
        } else {
          handleSaveChanges()
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.showShortcuts, state.showDeleteConfirm, state.editingId])

  // === データ取得 ===

  useEffect(() => {
    async function loadMemoItems() {
      if (isAuthenticated === undefined) return
      
      try {
        const result = await getMemoItems()
        updateState({ items: result.items })
      } catch (error) {
        console.error('メモ項目の取得に失敗:', error)
        toast.error('メモ項目の取得に失敗しました')
        updateState({ items: generateDemoData() })
      } finally {
        updateState({ isLoading: false })
      }
    }
    
    loadMemoItems()
  }, [isAuthenticated, updateState])

  // === 項目管理関数 ===

  const handleAddItem = useCallback(async () => {
    if (!newItemValidation.isValid) {
      toast.error(newItemValidation.error!)
      return
    }
    
    if (isMaxItemsReached) {
      toast.error(`メモ項目は最大${MAX_ITEMS_COUNT}個まで追加できます`)
      return
    }
    
    updateState({ isAdding: true })
    
    try {
      const order = await getNextOrder()
      const result = await createMemoItem({
        name: state.newItemName.trim(),
        order,
        visible: true
      })
      
      if (result.success && result.item) {
        updateState({ 
          items: [...state.items, result.item],
          newItemName: ''
        })
        toast.success(`「${state.newItemName.trim()}」を追加しました`)
      } else {
        toast.error(result.error || '項目の追加に失敗しました')
      }
    } catch (error) {
      console.error('項目追加エラー:', error)
      toast.error('項目の追加に失敗しました')
    } finally {
      updateState({ isAdding: false })
    }
  }, [newItemValidation, isMaxItemsReached, state.newItemName, state.items, updateState])

  const handleStartEditing = useCallback((item: MemoItem) => {
    updateState({ 
      editingId: item.id,
      editingName: item.name
    })
  }, [updateState])

  const handleSaveEdit = useCallback(async () => {
    if (!editingValidation.isValid || !state.editingId) {
      if (editingValidation.error) {
        toast.error(editingValidation.error)
      }
      return
    }
    
    const originalItems = [...state.items]
    const targetItem = state.items.find(item => item.id === state.editingId)
    
    if (!targetItem) {
      updateState({ editingId: null })
      return
    }
    
    try {
      // 楽観的UI更新
      updateState({ 
        items: state.items.map(item => 
          item.id === state.editingId 
            ? { ...item, name: state.editingName.trim() } 
            : item
        ),
        editingId: null
      })
      
      const result = await updateMemoItem({
        id: state.editingId,
        name: state.editingName.trim(),
      })
      
      if (result.success) {
        toast.success('項目名を更新しました')
      } else {
        updateState({ items: originalItems })
        toast.error(result.error || '項目の更新に失敗しました')
      }
    } catch (error) {
      console.error('編集エラー:', error)
      toast.error('項目の更新に失敗しました')
      updateState({ items: originalItems })
    }
  }, [editingValidation, state.editingId, state.editingName, state.items, updateState])

  const handleDeleteItem = useCallback(async (id: string) => {
    const originalItems = [...state.items]
    const itemToDelete = state.items.find(item => item.id === id)
    
    if (!itemToDelete) {
      updateState({ showDeleteConfirm: null })
      return
    }
    
    try {
      updateState({ 
        items: state.items.filter(item => item.id !== id),
        showDeleteConfirm: null
      })
      
      const result = await deleteMemoItem({ id })
      
      if (result.success) {
        toast.success('項目を削除しました')
      } else {
        updateState({ items: originalItems })
        toast.error(result.error || '項目の削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('項目の削除に失敗しました')
      updateState({ items: originalItems })
    }
  }, [state.items, updateState])

  // === ドラッグ&ドロップ ===

  const handleDragStart = useCallback((start: any) => {
    updateState({ draggingId: start.draggableId })
  }, [updateState])

  const handleDragEnd = useCallback((result: DragDropResult) => {
    updateState({ draggingId: null })
    
    if (!result.destination || result.source.index === result.destination.index) {
      return
    }
    
    try {
      const currentItems = [...state.items]
      const [movedItem] = currentItems.splice(result.source.index, 1)
      currentItems.splice(result.destination.index, 0, movedItem)
      
      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        order: index
      }))
      
      updateState({ items: updatedItems })
      toast.success('項目の順序を変更しました')
    } catch (error) {
      console.error('ドラッグ&ドロップエラー:', error)
      toast.error('順序変更に失敗しました')
    }
  }, [state.items, updateState])

  const handleSaveChanges = useCallback(async () => {
    updateState({ isSaving: true })
    
    try {
      const updateItems = state.items
        .filter(item => item.id)
        .map(item => ({
          id: item.id,
          order: item.order
        }))
      
      const result = await bulkUpdateMemoItemOrder(updateItems)
      
      if (result.success) {
        toast.success('メモ項目を保存しました')
      } else {
        toast.error(result.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      toast.error('保存に失敗しました')
    } finally {
      updateState({ isSaving: false })
    }
  }, [state.items, updateState])

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-0.5">
        <div className="rounded-[10px] bg-white/5 backdrop-blur-sm">
          <div className="flex gap-3 px-4 py-3 justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 p-2">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-md font-bold text-white md:text-xl">メモ項目設定</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateState({ showShortcuts: true })}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white backdrop-blur-sm transition hover:bg-white/20"
                title="キーボードショートカット (Cmd+/)"
              >
                <Keyboard size={16} />
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={state.isSaving}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-indigo-600 shadow-md transition hover:bg-white/90 disabled:opacity-70"
              >
                {state.isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    変更を保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Info size={16} className="text-indigo-500" />
            <span>
              {state.items.length} / {MAX_ITEMS_COUNT} 項目
              {isMaxItemsReached && <span className="ml-1 text-orange-600">（上限達成）</span>}
            </span>
          </div>
          <div className="text-gray-500">
            最大 {MAX_ITEM_NAME_LENGTH} 文字まで
          </div>
        </div>
      </div>

      {/* 新規項目の追加 */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Plus size={18} className="text-indigo-500" />
          新しいメモ項目を追加
        </h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={state.newItemName}
                onChange={(e) => updateState({ newItemName: e.target.value })}
                placeholder="例: 立ち回り、コンボ、崖狩りなど"
                maxLength={MAX_ITEM_NAME_LENGTH}
                disabled={isMaxItemsReached}
                className={`w-full rounded-full border px-4 py-2 focus:outline-none focus:ring-1 transition ${
                  !newItemValidation.isValid && state.newItemName
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/40'
                    : 'border-gray-300 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/40'
                } ${isMaxItemsReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemValidation.isValid && !isMaxItemsReached) {
                    handleAddItem()
                  }
                }}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className={`${
                  !newItemValidation.isValid && state.newItemName ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {!newItemValidation.isValid && state.newItemName ? newItemValidation.error : ''}
                </span>
                <span className="text-gray-400">
                  {state.newItemName.length} / {MAX_ITEM_NAME_LENGTH}
                </span>
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItemValidation.isValid || isMaxItemsReached || state.isAdding}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isAdding ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>追加中...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>追加</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 項目リスト */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
              <Settings size={16} className="text-indigo-500" />
              メモ項目一覧
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ArrowDown size={12} className="text-indigo-400" />
              <span>ドラッグ&ドロップで順序を変更</span>
            </div>
          </div>
        </div>

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="memo-items" type="MEMO_ITEM">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`divide-y divide-gray-100 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-indigo-50/50' : 'bg-white'
                }`}
              >
                {state.items.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="space-y-2">
                      <Settings className="mx-auto h-8 w-8 text-gray-300" />
                      <p>メモ項目がありません</p>
                      <p className="text-xs">上記のフォームから新しい項目を追加してください</p>
                    </div>
                  </div>
                ) : (
                  state.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => (
                      <Draggable 
                        key={`memo-item-${item.id}`} 
                        draggableId={`memo-item-${item.id}`} 
                        index={index}
                        isDragDisabled={state.editingId === item.id}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative py-2.5 pl-1 pr-2 transition-all ${
                              snapshot.isDragging
                                ? 'bg-white shadow-xl border-l-4 border-l-indigo-500 rounded-lg z-50'
                                : state.draggingId === item.id
                                ? 'opacity-50'
                                : 'border-l-3 border-transparent bg-white hover:border-l-indigo-500 hover:bg-indigo-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* ドラッグハンドル */}
                              <div
                                {...provided.dragHandleProps}
                                className={`cursor-grab rounded-md p-1.5 transition-colors ${
                                  snapshot.isDragging
                                    ? 'text-indigo-600 bg-indigo-100'
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                } active:cursor-grabbing ${
                                  state.editingId === item.id ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                                title={state.editingId === item.id ? '編集中はドラッグできません' : 'ドラッグして並び替え'}
                              >
                                <Grip size={16} />
                              </div>

                              {/* 項目名 */}
                              <div className="flex-1">
                                {state.editingId === item.id ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={state.editingName}
                                      onChange={(e) => updateState({ editingName: e.target.value })}
                                      maxLength={MAX_ITEM_NAME_LENGTH}
                                      className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 transition ${
                                        !editingValidation.isValid && state.editingName
                                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/40'
                                          : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/40'
                                      }`}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editingValidation.isValid) handleSaveEdit()
                                        if (e.key === 'Escape') updateState({ editingId: null })
                                      }}
                                      autoFocus
                                    />
                                    {!editingValidation.isValid && state.editingName && (
                                      <p className="text-xs text-red-600">{editingValidation.error}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium text-gray-800">
                                    {item.name}
                                  </span>
                                )}
                              </div>

                              {/* アクションボタン */}
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {state.editingId === item.id ? (
                                  <>
                                    <button
                                      onClick={handleSaveEdit}
                                      disabled={!editingValidation.isValid}
                                      className="rounded-md p-1.5 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                                      title="保存 (Enter)"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button
                                      onClick={() => updateState({ editingId: null })}
                                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:scale-110 transition-transform"
                                      title="キャンセル (Escape)"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEditing(item)}
                                      className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-100 hover:scale-110 transition-transform"
                                      title="編集"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => updateState({ showDeleteConfirm: item.id })}
                                      className="rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:scale-110 transition-transform"
                                      title="削除"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* キーボードショートカットダイアログ */}
      <AnimatePresence>
        {state.showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-indigo-100 p-2">
                  <Keyboard className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">キーボードショートカット</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>ショートカット表示</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Cmd + /</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>変更を保存</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Cmd + S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>ダイアログを閉じる</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Escape</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>編集を保存</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>編集をキャンセル</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Escape</kbd>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => updateState({ showShortcuts: false })}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 削除確認ダイアログ */}
      <AnimatePresence>
        {state.showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">項目を削除</h3>
              </div>
              <p className="mb-6 text-gray-600">
                この項目を削除してもよろしいですか？この操作は取り消せません。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => updateState({ showDeleteConfirm: null })}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => state.showDeleteConfirm && handleDeleteItem(state.showDeleteConfirm)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}