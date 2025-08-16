'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CategorySection } from './components/CategorySection'
import { CreateCategoryDialog, EditCategoryDialog } from './components/CategoryDialogs'
import { useDashboardData } from './hooks/useDashboardData'
import { useCategoryActions } from './hooks/useCategoryActions'
import type { CharacterCategory, Character } from '@/types'

export default function Dashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CharacterCategory | null>(null)

  // データ管理
  const { state, getCharactersInCategory, getUncategorizedCharacters, updateCategories } = useDashboardData()
  
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
      {/* キャラクター一覧 */}
      <div className="space-y-6">
        {/* カテゴリなしの場合はすべてのキャラクター表示 */}
        {state.categories.length === 0 && state.characters.length > 0 && (
          <CategorySection
            key="all-characters"
            category={{
              id: "all-characters",
              name: "すべてのキャラクター",
              color: "#6B7280",
              order: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }}
            characters={state.characters}
            onEditCategory={() => {}} // カテゴリなしの場合は編集不可
          />
        )}

        {/* カテゴリー別キャラクター一覧 */}
        {state.categories.map((category) => {
          const charactersInCategory = getCharactersInCategory(category.id)
          
          return (
            <CategorySection
              key={category.id}
              category={category}
              characters={charactersInCategory}
              onEditCategory={handleEditCategory}
            />
          )
        })}

        {/* キャラクターが存在しない場合 */}
        {state.characters.length === 0 && !state.isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">キャラクターデータがありません</p>
            <p className="text-sm text-gray-400">キャラクターデータをシーディングしてください</p>
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
