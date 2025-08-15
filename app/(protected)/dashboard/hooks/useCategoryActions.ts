/**
 * カテゴリー操作カスタムフック
 * 
 * キャラクターカテゴリーの作成・更新・削除操作を管理します。
 * React hooksパターンを使用して、状態管理とビジネスロジックを
 * コンポーネントから分離します。
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { CharacterCategory } from '@/types'
import type { 
  CreateCategoryInput, 
  UpdateCategoryInput,
  DeleteCategoryInput,
  CategoryOperationResult 
} from '../types'

/**
 * カテゴリー操作の状態管理
 */
interface CategoryActionsState {
  /** 現在編集中のカテゴリーID */
  editingCategoryId: string | null
  /** 操作中フラグ */
  isOperating: boolean
}

/**
 * カテゴリー操作フックの戻り値
 */
interface UseCategoryActionsReturn {
  /** 現在の状態 */
  state: CategoryActionsState
  /** カテゴリー作成 */
  createCategory: (input: CreateCategoryInput) => Promise<CategoryOperationResult>
  /** カテゴリー更新 */
  updateCategory: (input: UpdateCategoryInput) => Promise<CategoryOperationResult>
  /** カテゴリー削除 */
  deleteCategory: (input: DeleteCategoryInput) => Promise<CategoryOperationResult>
  /** 編集開始 */
  startEditing: (categoryId: string) => void
  /** 編集終了 */
  stopEditing: () => void
}

/**
 * カテゴリー操作フック
 * 
 * @param categories - 現在のカテゴリー一覧
 * @param onCategoriesChange - カテゴリー一覧変更時のコールバック
 * @returns カテゴリー操作機能
 */
export function useCategoryActions(
  categories: CharacterCategory[],
  onCategoriesChange: (categories: CharacterCategory[]) => void
): UseCategoryActionsReturn {
  const [state, setState] = useState<CategoryActionsState>({
    editingCategoryId: null,
    isOperating: false
  })

  /**
   * カテゴリー作成
   */
  const createCategory = useCallback(async (input: CreateCategoryInput): Promise<CategoryOperationResult> => {
    setState(prev => ({ ...prev, isOperating: true }))
    
    try {
      // TODO: 実際のAPIコールに置き換え
      await new Promise(resolve => setTimeout(resolve, 500)) // APIコールのシミュレーション
      
      const newCategory: CharacterCategory = {
        id: `category-${Date.now()}`,
        name: input.name,
        color: input.color,
        order: input.order,
        userId: 'current-user', // TODO: 実際のユーザーIDに置き換え
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedCategories = [...categories, newCategory].sort((a, b) => a.order - b.order)
      onCategoriesChange(updatedCategories)
      
      toast.success('カテゴリーを作成しました')
      
      return { success: true, category: newCategory }
    } catch (error) {
      const errorMessage = 'カテゴリーの作成に失敗しました'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setState(prev => ({ ...prev, isOperating: false }))
    }
  }, [categories, onCategoriesChange])

  /**
   * カテゴリー更新
   */
  const updateCategory = useCallback(async (input: UpdateCategoryInput): Promise<CategoryOperationResult> => {
    setState(prev => ({ ...prev, isOperating: true }))
    
    try {
      // TODO: 実際のAPIコールに置き換え
      await new Promise(resolve => setTimeout(resolve, 500)) // APIコールのシミュレーション
      
      const updatedCategories = categories.map(category => {
        if (category.id === input.id) {
          return { ...category, ...input, updatedAt: new Date().toISOString() }
        }
        return category
      }).sort((a, b) => a.order - b.order)
      
      onCategoriesChange(updatedCategories)
      
      const updatedCategory = updatedCategories.find(cat => cat.id === input.id)
      
      toast.success('カテゴリーを更新しました')
      
      return { success: true, category: updatedCategory }
    } catch (error) {
      const errorMessage = 'カテゴリーの更新に失敗しました'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setState(prev => ({ ...prev, isOperating: false }))
    }
  }, [categories, onCategoriesChange])

  /**
   * カテゴリー削除
   */
  const deleteCategory = useCallback(async (input: DeleteCategoryInput): Promise<CategoryOperationResult> => {
    setState(prev => ({ ...prev, isOperating: true }))
    
    try {
      // TODO: 実際のAPIコールに置き換え
      await new Promise(resolve => setTimeout(resolve, 500)) // APIコールのシミュレーション
      
      const updatedCategories = categories.filter(category => category.id !== input.id)
      onCategoriesChange(updatedCategories)
      
      toast.success('カテゴリーを削除しました')
      
      return { success: true }
    } catch (error) {
      const errorMessage = 'カテゴリーの削除に失敗しました'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setState(prev => ({ ...prev, isOperating: false }))
    }
  }, [categories, onCategoriesChange])

  /**
   * 編集開始
   */
  const startEditing = useCallback((categoryId: string) => {
    setState(prev => ({ ...prev, editingCategoryId: categoryId }))
  }, [])

  /**
   * 編集終了
   */
  const stopEditing = useCallback(() => {
    setState(prev => ({ ...prev, editingCategoryId: null }))
  }, [])

  return {
    state,
    createCategory,
    updateCategory,
    deleteCategory,
    startEditing,
    stopEditing
  }
}