/**
 * キャラクター関連の型定義
 * 
 * スマッシュブラザーズのキャラクターとカテゴリー管理に関する
 * TypeScript型定義を提供します。
 */

/**
 * スマッシュブラザーズキャラクター
 */
export interface Character {
  /** キャラクターID */
  id: string
  /** キャラクター名 */
  name: string
  /** キャラクター画像URL */
  imageUrl: string
  /** 表示順序 */
  order: number
  /** 所属カテゴリーID */
  categoryId: string
}

/**
 * キャラクターカテゴリー
 */
export interface CharacterCategory {
  /** カテゴリーID */
  id: string
  /** カテゴリー名 */
  name: string
  /** 表示順序 */
  order: number
  /** カテゴリーの色（UI表示用） */
  color: string
  /** ユーザーID（作成者） */
  userId: string
}

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
 * ドラッグ&ドロップ結果
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