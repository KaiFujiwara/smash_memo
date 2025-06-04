/**
 * メモ項目一覧のコンポーネント（ドラッグ&ドロップ対応）
 */

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Settings, ArrowDown, Grip, Edit2, Save, X } from 'lucide-react'
import type { MemoItem, DragDropResult } from '@/types'
import type { ValidationResult } from '../types'
import { MAX_ITEM_NAME_LENGTH } from '../types'

interface MemoItemsListProps {
  items: MemoItem[]
  editingId: string | null
  editingName: string
  editingValidation: ValidationResult
  draggingId: string | null
  onDragStart: (start: any) => void
  onDragEnd: (result: DragDropResult) => void
  onStartEditing: (item: MemoItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditingNameChange: (name: string) => void
  onDeleteConfirm: (id: string) => void
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
                    <Draggable 
                      key={`memo-item-${item.id}`} 
                      draggableId={`memo-item-${item.id}`} 
                      index={index}
                      isDragDisabled={editingId === item.id}
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
                            draggingId ? '' : 'transition-colors transition-opacity duration-150 ease-out'
                          } ${
                            snapshot.isDragging
                              ? 'bg-white shadow-xl drag-border-indigo rounded-lg z-50'
                              : draggingId === item.id
                              ? 'opacity-50 drag-border-transparent'
                              : draggingId
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
                                editingId === item.id ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                              title={editingId === item.id ? '編集中はドラッグできません' : 'ドラッグして並び替え'}
                            >
                              <Grip size={16} />
                            </div>

                            {/* 項目名 */}
                            <div className="flex-1">
                              {editingId === item.id ? (
                                <div className="space-y-1">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) => onEditingNameChange(e.target.value)}
                                      maxLength={MAX_ITEM_NAME_LENGTH}
                                      className={`w-full rounded-md border px-2 py-1 pr-12 text-sm focus:outline-none focus:ring-1 transition ${
                                        !editingValidation.isValid && editingName
                                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/40'
                                          : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/40'
                                      }`}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editingValidation.isValid) onSaveEdit()
                                        if (e.key === 'Escape') onCancelEdit()
                                      }}
                                      autoFocus
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
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {editingId === item.id ? (
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
                                    title="編集"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteConfirm(item.id)}
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
  )
} 