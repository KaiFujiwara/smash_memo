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
  /** キャラクター名 */
  name: string
  /** キャラクター画像URL */
  icon: string
  /** 表示順序 */
  order: number
  /** 作成日時 */
  createdAt: string
  /** 更新日時 */
  updatedAt: string
}


