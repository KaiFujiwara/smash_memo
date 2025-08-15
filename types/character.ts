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
  icon: string
  /** 表示順序 */
  order: number
  /** 所属カテゴリーID */
  categoryId: string | null
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
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
  userId?: string
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}

