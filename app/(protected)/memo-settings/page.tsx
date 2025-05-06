'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Grip, X, Edit2, Save, AlertTriangle, Settings, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface MemoItem {
  id: string
  name: string
  order: number
  userId: string
}

export default function MemoSettingsPage() {
  const [items, setItems] = useState<MemoItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const client = generateClient()

  // 初期データの取得
  useEffect(() => {
    async function loadUserAndItems() {
      try {
        const user = await getCurrentUser()
        setUserId(user.userId)
        
        // 直接クエリを定義
        const response = await client.graphql({
          query: `
            query ListMemoItemsByUser($userId: ID!) {
              listMemoItemsByUser(userId: $userId) {
                items {
                  id
                  name
                  order
                  userId
                  _version
                }
              }
            }
          `,
          variables: { userId: user.userId }
        })
        
        const fetchedItems = response.data.listMemoItemsByUser.items || []
        setItems(fetchedItems)
      } catch (error) {
        console.error('データ取得エラー:', error)
        toast.error('メモ項目の取得に失敗しました')
        
        // エラー時はデモデータを表示
        setItems([
          { id: '1', name: '立ち回り', order: 0, userId: 'demo' },
          { id: '2', name: '崖狩り', order: 1, userId: 'demo' },
          { id: '3', name: '復帰阻止', order: 2, userId: 'demo' },
          { id: '4', name: 'コンボ', order: 3, userId: 'demo' },
          { id: '5', name: 'キル確', order: 4, userId: 'demo' },
          { id: '6', name: '注意点', order: 5, userId: 'demo' },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserAndItems()
  }, [])

  // 項目の追加
  const handleAddItem = async () => {
    if (!newItemName.trim() || !userId) {
      toast.error('項目名を入力してください')
      return
    }
    
    const newItem: MemoItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      order: items.length,
      userId: userId
    }
    
    try {
      // 楽観的UI更新
      setItems([...items, newItem])
      setNewItemName('')
      
      // 直接クエリを定義
      await client.graphql({
        query: `
          mutation CreateMemoItem($input: CreateMemoItemInput!) {
            createMemoItem(input: $input) {
              id
              name
              order
              userId
              _version
            }
          }
        `,
        variables: { input: newItem }
      })
      
      toast.success(`「${newItemName}」を追加しました`)
    } catch (error) {
      console.error('追加エラー:', error)
      toast.error('項目の追加に失敗しました')
      // エラー時は項目を元に戻す
      setItems(items.filter(item => item.id !== newItem.id))
    }
  }

  // 項目の編集モード開始
  const startEditing = (item: MemoItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  // 項目の編集保存
  const saveEdit = async () => {
    if (!editingName.trim() || !editingId) {
      toast.error('項目名を入力してください')
      return
    }
    
    const originalItems = [...items]
    const updatedItem = items.find(item => item.id === editingId)
    
    if (!updatedItem) {
      setEditingId(null)
      return
    }
    
    try {
      // 楽観的UI更新
      setItems(items.map(item => 
        item.id === editingId 
          ? { ...item, name: editingName.trim() } 
          : item
      ))
      
      setEditingId(null)
      
      // 直接クエリを定義
      await client.graphql({
        query: `
          mutation UpdateMemoItem($input: UpdateMemoItemInput!) {
            updateMemoItem(input: $input) {
              id
              name
              order
              _version
            }
          }
        `,
        variables: { 
          input: { 
            id: editingId,
            name: editingName.trim(),
            _version: updatedItem._version
          } 
        }
      })
      
      toast.success('項目名を更新しました')
    } catch (error) {
      console.error('編集エラー:', error)
      toast.error('項目の更新に失敗しました')
      // エラー時は項目を元に戻す
      setItems(originalItems)
    }
  }

  // 項目の削除
  const handleDeleteItem = async (id: string) => {
    const originalItems = [...items]
    const itemToDelete = items.find(item => item.id === id)
    
    if (!itemToDelete) {
      setShowDeleteConfirm(null)
      return
    }
    
    try {
      // 楽観的UI更新
      setItems(items.filter(item => item.id !== id))
      setShowDeleteConfirm(null)
      
      // 直接クエリを定義
      await client.graphql({
        query: `
          mutation DeleteMemoItem($input: DeleteMemoItemInput!) {
            deleteMemoItem(input: $input) {
              id
              _version
            }
          }
        `,
        variables: { 
          input: { 
            id: id,
            _version: itemToDelete._version
          } 
        }
      })
      
      toast.success('項目を削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('項目の削除に失敗しました')
      // エラー時は項目を元に戻す
      setItems(originalItems)
    }
  }

  // 項目の並び替え
  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const startIndex = result.source.index
    const endIndex = result.destination.index
    
    const reorderedItems = Array.from(items)
    const [removed] = reorderedItems.splice(startIndex, 1)
    reorderedItems.splice(endIndex, 0, removed)
    
    // orderプロパティを更新
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setItems(updatedItems)
  }

  // 変更を保存
  const saveChanges = async () => {
    setIsSaving(true)
    
    try {
      // 全項目の順序を一括更新
      const updatePromises = items.map(item => 
        client.graphql({
          query: `
            mutation UpdateMemoItem($input: UpdateMemoItemInput!) {
              updateMemoItem(input: $input) {
                id
                order
                _version
              }
            }
          `,
          variables: { 
            input: { 
              id: item.id,
              order: item.order,
              _version: item._version
            } 
          }
        })
      )
      
      await Promise.all(updatePromises)
      toast.success('メモ項目を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー部分 */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-0.5">
        <div className="rounded-[10px] bg-white/5 backdrop-blur-sm">
          <div className="flex gap-3 px-4 py-3 justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 p-2">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-md font-bold text-white md:text-xl">メモ項目設定</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveChanges}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-indigo-600 shadow-md transition hover:bg-white/90 disabled:opacity-70"
            >
              {isSaving ? (
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
            </motion.button>
          </div>
        </div>
      </div>

      {/* 新規項目の追加 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-white p-4 shadow-md"
      >
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Plus size={18} className="text-indigo-500" />
          新しいメモ項目を追加
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="例: 立ち回り、コンボ、崖狩りなど"
            className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddItem}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            <span>追加</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 項目リスト */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl bg-white shadow-md"
      >
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="memo-items">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="divide-y divide-gray-100 px-0.5"
              >
                {items.length === 0 ? (
                  <li className="py-8 text-center text-gray-500">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <Plus size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm">メモ項目がありません。新しい項目を追加してください。</p>
                  </li>
                ) : (
                  items
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <motion.li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group relative border-l-3 border-transparent bg-white py-2.5 pl-1 pr-2 transition hover:border-l-indigo-500 hover:bg-indigo-50/50"
                            whileHover={{ x: 2 }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab rounded-md p-1.5 text-gray-400 transition hover:bg-indigo-100 hover:text-indigo-600"
                              >
                                <Grip size={16} />
                              </div>

                              {editingId === item.id ? (
                                <div className="flex flex-1 items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="flex-1 rounded-full border border-indigo-300 bg-white px-3 py-1.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                  />
                                  <button
                                    onClick={saveEdit}
                                    className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded-full bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-1 items-center justify-between">
                                  <span className="font-medium text-gray-800">{item.name}</span>
                                  <div className="flex opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="rounded-full p-1.5 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600"
                                      title="編集"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(item.id)}
                                      className="rounded-full p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600"
                                      title="削除"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.li>
                        )}
                      </Draggable>
                    ))
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </motion.div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" 
          onClick={() => setShowDeleteConfirm(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-600">
                <div className="rounded-full bg-red-100 p-1.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold">項目の削除</h2>
              </div>
            </div>
            
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-700">
                「{items.find(i => i.id === showDeleteConfirm)?.name}」を削除しますか？
                <br /><br />
                <span className="font-medium text-red-600">この項目に関連するすべてのキャラクターのデータも削除されます。</span>
                <br />
                この操作は元に戻せません。
              </p>
              
              <div className="flex flex-row justify-end gap-2">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleDeleteItem(showDeleteConfirm)}
                  className="rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-1.5 text-sm font-medium text-white shadow-md hover:shadow-lg"
                >
                  削除する
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}