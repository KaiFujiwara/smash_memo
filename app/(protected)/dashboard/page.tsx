'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { DashboardHeader } from './components/DashboardHeader'
import { CategorySection } from './components/CategorySection'
import { CreateCategoryDialog, EditCategoryDialog } from './components/CategoryDialogs'
import { useDashboardData } from './hooks/useDashboardData'
import { useCategoryActions } from './hooks/useCategoryActions'
import type { CharacterCategory, Character } from '@/types'

export default function Dashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CharacterCategory | null>(null)

  // データ管理
  const { state, getCharactersInCategory, updateCategories, setMode } = useDashboardData()
  
  // カテゴリー操作
  const categoryActions = useCategoryActions(state.categories, updateCategories)

  /**
   * カテゴリー作成処理
   */
  const handleCreateCategory = async (input: { name: string; color: string; order: number }) => {
    const result = await categoryActions.createCategory(input)
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  /**
   * カテゴリー更新処理
   */
  const handleUpdateCategory = async (input: { id: string; name?: string; color?: string }) => {
    const result = await categoryActions.updateCategory(input)
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  /**
   * カテゴリー削除処理
   */
  const handleDeleteCategory = async (categoryId: string) => {
    const result = await categoryActions.deleteCategory({ id: categoryId })
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  /**
   * カテゴリー編集開始
   */
  const handleEditCategory = (category: CharacterCategory) => {
    setEditingCategory(category)
  }

  /**
   * キャラクタークリック処理
   */
  const handleCharacterClick = (character: Character) => {
    if (state.mode === 'edit') {
      toast.info('編集モードではキャラクターの詳細を表示できません')
      return
    }
    // メモ画面への遷移は CharacterCard コンポーネント内で処理
  }

  /**
   * 新規カテゴリー追加
   */
  const handleAddCategory = () => {
    setShowCreateDialog(true)
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">データを読み込み中...</div>
      </div>
    )
  }

  // 次のカテゴリー順序を計算
  const nextCategoryOrder = Math.max(...state.categories.map(c => c.order), 0) + 1

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
      <DashboardHeader
        mode={state.mode}
        onModeChange={setMode}
        onAddCategory={handleAddCategory}
      />

      {/* カテゴリー別キャラクター一覧 */}
      <div className="space-y-6">
        {state.categories.map((category) => {
          const charactersInCategory = getCharactersInCategory(category.id)
          
          return (
            <CategorySection
              key={category.id}
              category={category}
              characters={charactersInCategory}
              mode={state.mode}
              onCharacterClick={handleCharacterClick}
              onEditCategory={handleEditCategory}
            />
          )
        })}

        {/* カテゴリーが存在しない場合 */}
        {state.categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">カテゴリーがありません</p>
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              最初のカテゴリーを作成
            </button>
          </div>
        )}
      </div>

      {/* カテゴリー作成ダイアログ */}
      <CreateCategoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCategory={handleCreateCategory}
        nextOrder={nextCategoryOrder}
      />

      {/* カテゴリー編集ダイアログ */}
      <EditCategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  )
}
