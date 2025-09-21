/**
 * 個別メモ項目コンポーネント
 */

import { Draggable } from '@hello-pangea/dnd'
import { Grip, Edit2, Save, X, Trash2 } from 'lucide-react'
import type { MemoItem } from '@/types'
import type { ValidationResult } from '../types'
import { MAX_ITEM_NAME_LENGTH } from '../types'

interface MemoItemProps {
  item: MemoItem
  index: number
  isEditing: boolean
  editingName: string
  editingValidation: ValidationResult
  isDragging: boolean
  onStartEditing: (item: MemoItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditingNameChange: (name: string) => void
  onDeleteConfirm: (item: MemoItem) => void
  tooltip: {
    editDisabled: string
    dragToReorder: string
    edit: string
    delete: string
  }
}

export function MemoItem({
  item,
  index,
  isEditing,
  editingName,
  editingValidation,
  isDragging,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onDeleteConfirm,
  tooltip
}: MemoItemProps) {
  return (
    <Draggable 
      key={`memo-item-${item.id}`} 
      draggableId={`memo-item-${item.id}`} 
      index={index}
      isDragDisabled={isEditing}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative py-2.5 pl-1 pr-2 ${
            // index > 0 の場合のみ上部ボーダーを追加
            index > 0 ? 'border-t border-gray-100' : ''
          } ${
            // 並び替え処理中（draggingId が存在する）はトランジションを無効化
            isDragging ? '' : 'transition-colors transition-opacity duration-150 ease-out'
          } ${
            snapshot.isDragging
              ? 'bg-white shadow-xl drag-border-indigo rounded-lg z-50'
              : isDragging
              ? 'opacity-50 drag-border-transparent'
              : isDragging
              ? 'drag-border-transparent bg-white'  // ドラッグ中は他の項目のホバー効果を無効化
              : 'drag-border-transparent bg-white drag-hover-border hover:bg-indigo-50/50'
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
                isEditing ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title={isEditing ? tooltip.editDisabled : tooltip.dragToReorder}
            >
              <Grip size={16} />
            </div>

            {/* 項目名 */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => onEditingNameChange(e.target.value)}
                      maxLength={MAX_ITEM_NAME_LENGTH}
                      className={`w-full rounded-md border px-2 py-1 pr-12 text-base focus:outline-none focus:ring-1 transition ${
                        !editingValidation.isValid && editingName
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/40'
                          : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/40'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingValidation.isValid) onSaveEdit()
                        if (e.key === 'Escape') onCancelEdit()
                      }}
                      // autoFocus disabled to prevent mobile zoom
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {editingName.length}/{MAX_ITEM_NAME_LENGTH}
                    </div>
                  </div>
                  {!editingValidation.isValid && editingName && (
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
            <div className="flex items-center gap-1 opacity-70 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
              {isEditing ? (
                <>
                  <button
                    onClick={onSaveEdit}
                    disabled={!editingValidation.isValid}
                    className="rounded-md p-1.5 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                    title="保存 (Enter)"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:scale-110 transition-transform"
                    title="キャンセル (Escape)"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onStartEditing(item)}
                    className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-100 hover:scale-110 transition-transform"
                    title={tooltip.edit}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteConfirm(item)}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:scale-110 transition-transform"
                    title={tooltip.delete}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
} 