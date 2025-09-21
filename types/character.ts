/**
 * キャラクター関連の型定義
 * 
 * スマッシュブラザーズのキャラクター管理に関する
 * TypeScript型定義を提供します。
 */

/**
 * スマッシュブラザーズキャラクター
 */
export interface Character {
  /** キャラクターID */
  id: string
  /** キャラクター名 (日本語) */
  name: string
  /** キャラクター名 (英語) */
  nameEn?: string
  /** キャラクター名 (中国語) */
  nameZh?: string
  /** キャラクター画像URL */
  icon: string
  /** 表示順序 */
  order: number
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}


