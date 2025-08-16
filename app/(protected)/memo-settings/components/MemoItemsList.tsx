/**
 * メモ項目一覧のコンポーネント（ドラッグ&ドロップ対応）
 */

import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { Settings, ArrowDown } from 'lucide-react'
import type { MemoItem as MemoItemType, DragDropResult } from '@/types'
import type { ValidationResult } from '../types'
import { MemoItem } from './MemoItem'

interface MemoItemsListProps {
  items: MemoItemType[]
  editingId: string | null
  editingName: string
  editingValidation: ValidationResult
  draggingId: string | null
  onDragStart: (start: any) => void
  onDragEnd: (result: DragDropResult) => void
  onStartEditing: (item: MemoItemType) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditingNameChange: (name: string) => void
  onDeleteConfirm: (item: MemoItemType) => void
}

export function MemoItemsList({
  items,
  editingId,
  editingName,
  editingValidation,
  draggingId,
  onDragStart,
  onDragEnd,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onDeleteConfirm
}: MemoItemsListProps) {
  return (
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

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="memo-items" type="MEMO_ITEM">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`transition-colors ${
                snapshot.isDraggingOver ? 'bg-indigo-50/50' : 'bg-white'
              }`}
            >
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="space-y-2">
                    <Settings className="mx-auto h-8 w-8 text-gray-300" />
                    <p>メモ項目がありません</p>
                    <p className="text-xs">上記のフォームから新しい項目を追加してください</p>
                  </div>
                </div>
              ) : (
                items
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <MemoItem
                      key={`memo-item-${item.id}`}
                      item={item}
                      index={index}
                      isEditing={editingId === item.id}
                      editingName={editingName}
                      editingValidation={editingValidation}
                      isDragging={draggingId === item.id}
                      onStartEditing={onStartEditing}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onEditingNameChange={onEditingNameChange}
                      onDeleteConfirm={onDeleteConfirm}
                    />
                  ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
} 