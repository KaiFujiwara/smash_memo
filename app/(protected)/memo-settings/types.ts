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
  draggingId: string | null
}


export interface ValidationResult {
  isValid: boolean
  error: string | null
}

// 定数定義
export const MAX_ITEM_NAME_LENGTH = 50
export const MIN_ITEM_NAME_LENGTH = 1
export const MAX_ITEMS_COUNT = 20 