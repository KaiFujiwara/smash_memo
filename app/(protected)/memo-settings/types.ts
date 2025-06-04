/**
 * メモ設定ページの型定義
 */

export interface MemoSettingsState {
  items: import('@/types').MemoItem[]
  newItemName: string
  editingId: string | null
  editingName: string
  isLoading: boolean
  isSaving: boolean
  isAdding: boolean
  showDeleteConfirm: string | null
  showUnsavedWarning: boolean
  draggingId: string | null
  forceUpdateCounter: number
  // ローカル編集用の状態
  pendingChanges: PendingChange[]
  nextTempId: number
  // 離脱先情報
  pendingNavigation: PendingNavigation | null
}

export interface PendingChange {
  type: 'add' | 'edit' | 'delete' | 'reorder'
  itemId?: string
  tempId?: string
  data?: any
}

export interface PendingNavigation {
  type: 'link' | 'back' | 'external'
  url?: string
  timestamp: number
}

export interface ValidationResult {
  isValid: boolean
  error: string | null
}

// 定数定義
export const MAX_ITEM_NAME_LENGTH = 20
export const MIN_ITEM_NAME_LENGTH = 1
export const MAX_ITEMS_COUNT = 20 