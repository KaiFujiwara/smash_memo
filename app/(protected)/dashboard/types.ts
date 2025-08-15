/**
 * ダッシュボードページ専用の型定義
 * 
 * ダッシュボードページとその関連コンポーネントでのみ使用される
 * ローカルな型定義を集約します。
 */

import type { CharacterCategory } from '@/types'

/**
 * ダッシュボードの表示モード
 */
export type DashboardMode = 'view' | 'edit'

/**
 * カテゴリー作成用の入力データ
 */
export interface CreateCategoryInput {
  name: string
  color: string
  order: number
}

/**
 * カテゴリー更新用の入力データ
 */
export interface UpdateCategoryInput {
  id: string
  name?: string
  color?: string
  order?: number
}

/**
 * カテゴリー削除用の入力データ
 */
export interface DeleteCategoryInput {
  id: string
}

/**
 * カテゴリードラッグ&ドロップ結果
 */
export interface CategoryDragDropResult {
  /** ドロップされたカテゴリーID */
  categoryId: string
  /** 新しい順序 */
  newOrder: number
  /** 移動元の順序 */
  oldOrder: number
}

/**
 * カテゴリー操作結果
 */
export interface CategoryOperationResult {
  /** 操作成功フラグ */
  success: boolean
  /** エラーメッセージ（失敗時） */
  error?: string
  /** 操作後のカテゴリー（成功時） */
  category?: CharacterCategory
}