/**
 * カテゴリー管理ダイアログコンポーネント
 * 
 * カテゴリーの作成・編集・削除を行うダイアログを提供します。
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { CharacterCategory } from '@/types'
import type { CreateCategoryInput, UpdateCategoryInput } from '../types'

/**
 * カテゴリー作成ダイアログのプロパティ
 */
interface CreateCategoryDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean
  /** ダイアログ開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void
  /** カテゴリー作成時のコールバック */
  onCreateCategory: (input: CreateCategoryInput) => Promise<void>
  /** 次の表示順序 */
  nextOrder: number
}

/**
 * カテゴリー作成ダイアログ
 */
export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreateCategory,
  nextOrder
}: CreateCategoryDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 事前定義されたカラーパレット
  const colorOptions = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16'  // lime-500
  ]

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onCreateCategory({
        name: name.trim(),
        color,
        order: nextOrder
      })
      
      // フォームリセット
      setName('')
      setColor('#3B82F6')
      onOpenChange(false)
    } catch (error) {
      console.error('カテゴリー作成エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいカテゴリーを作成</DialogTitle>
          <DialogDescription>
            キャラクターを整理するためのカテゴリーを作成します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリー名入力 */}
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium mb-2">
              カテゴリー名
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: よく使うキャラ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              カテゴリーカラー
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`
                    w-12 h-12 rounded-md border-2 transition-all
                    ${color === colorOption ? 'border-gray-800 scale-110' : 'border-gray-300'}
                  `}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? '作成中...' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * カテゴリー編集ダイアログのプロパティ
 */
interface EditCategoryDialogProps {
  /** 編集対象のカテゴリー */
  category: CharacterCategory | null
  /** ダイアログの開閉状態 */
  open: boolean
  /** ダイアログ開閉状態変更時のコールバック */
  onOpenChange: (open: boolean) => void
  /** カテゴリー更新時のコールバック */
  onUpdateCategory: (input: UpdateCategoryInput) => Promise<void>
  /** カテゴリー削除時のコールバック */
  onDeleteCategory: (categoryId: string) => Promise<void>
}

/**
 * カテゴリー編集ダイアログ
 */
export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onUpdateCategory,
  onDeleteCategory
}: EditCategoryDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 事前定義されたカラーパレット
  const colorOptions = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16'  // lime-500
  ]

  // カテゴリーデータでフォームを初期化
  useEffect(() => {
    if (category) {
      setName(category.name)
      setColor(category.color)
    }
  }, [category])

  /**
   * 更新処理
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !name.trim()) return

    setIsSubmitting(true)
    try {
      await onUpdateCategory({
        id: category.id,
        name: name.trim(),
        color
      })
      onOpenChange(false)
    } catch (error) {
      console.error('カテゴリー更新エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 削除処理
   */
  const handleDelete = async () => {
    if (!category) return
    
    const confirmed = window.confirm(`「${category.name}」を削除しますか？この操作は取り消せません。`)
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      await onDeleteCategory(category.id)
      onOpenChange(false)
    } catch (error) {
      console.error('カテゴリー削除エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カテゴリーを編集</DialogTitle>
          <DialogDescription>
            「{category.name}」カテゴリーの設定を変更します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* カテゴリー名入力 */}
          <div>
            <label htmlFor="edit-category-name" className="block text-sm font-medium mb-2">
              カテゴリー名
            </label>
            <input
              id="edit-category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              カテゴリーカラー
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`
                    w-12 h-12 rounded-md border-2 transition-all
                    ${color === colorOption ? 'border-gray-800 scale-110' : 'border-gray-300'}
                  `}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              削除
            </Button>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? '更新中...' : '更新'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}