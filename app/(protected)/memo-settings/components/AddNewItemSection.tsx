/**
 * 新規メモ項目追加セクションのコンポーネント
 */

import { Plus } from 'lucide-react'
import type { ValidationResult } from '../types'
import { MAX_ITEM_NAME_LENGTH, MAX_ITEMS_COUNT } from '../types'

interface AddNewItemSectionProps {
  newItemName: string
  itemsCount: number
  isAdding: boolean
  validation: ValidationResult
  onNameChange: (name: string) => void
  onAddItem: () => void
}

export function AddNewItemSection({
  newItemName,
  itemsCount,
  isAdding,
  validation,
  onNameChange,
  onAddItem
}: AddNewItemSectionProps) {
  const isMaxItemsReached = itemsCount >= MAX_ITEMS_COUNT

  return (
    <div className="rounded-xl bg-white p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <Plus size={18} className="text-indigo-500" />
          新しいメモ項目を追加
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{itemsCount} / {MAX_ITEMS_COUNT} 項目</span>
          {isMaxItemsReached && <span className="text-orange-600">（上限達成）</span>}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="例：立ち回り、コンボ"
                maxLength={MAX_ITEM_NAME_LENGTH}
                disabled={isMaxItemsReached}
                className={`w-full rounded-full border px-4 py-2 pr-12 text-sm sm:text-base sm:pr-16 focus:outline-none focus:ring-1 transition ${
                  !validation.isValid && newItemName
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/40'
                    : 'border-gray-300 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/40'
                } ${isMaxItemsReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && validation.isValid && !isMaxItemsReached) {
                    onAddItem()
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {newItemName.length}/{MAX_ITEM_NAME_LENGTH}
              </div>
            </div>
            {!validation.isValid && newItemName && (
              <p className="mt-1 text-xs text-red-600">{validation.error}</p>
            )}
          </div>
          <button
            onClick={onAddItem}
            disabled={!validation.isValid || isMaxItemsReached || isAdding}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
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
  )
} 