/**
 * メモ内容関連の型定義
 * 
 * キャラクターとメモ項目の組み合わせで保存される
 * 実際のメモ内容に関する型を定義しています。
 */

/**
 * メモ内容の基本情報
 * 
 * DynamoDBのMemoContentテーブルに対応する型です。
 * 特定のキャラクターと特定のメモ項目の組み合わせで
 * 一つのメモ内容を表現します。
 */
export interface MemoContent {
  /** メモ内容の一意識別子 */
  id: string
  /** 対象キャラクターのID */
  characterId: string
  /** メモ項目のID */
  memoItemId: string
  /** メモの内容 */
  content?: string
  /** 作成日時（ISO文字列） */
  createdAt?: string
  /** 更新日時（ISO文字列） */
  updatedAt?: string
  /** 所有者のユーザーID（Amplifyが自動設定） */
  owner?: string
}

/**
 * メモ内容作成用の入力型
 */
export interface CreateMemoContentInput {
  /** 対象キャラクターのID */
  characterId: string
  /** メモ項目のID */
  memoItemId: string
  /** メモの内容 */
  content?: string
}

/**
 * メモ内容更新用の入力型
 */
export interface UpdateMemoContentInput {
  /** 更新対象のID */
  id: string
  /** 新しいメモ内容 */
  content?: string
}

/**
 * メモ内容削除用の入力型
 */
export interface DeleteMemoContentInput {
  /** 削除対象のID */
  id: string
}

/**
 * メモ内容の操作結果を表す型
 */
export interface MemoContentOperationResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** エラーが発生した場合のメッセージ */
  error?: string
  /** 操作後のメモ内容（成功時のみ） */
  content?: MemoContent
}

/**
 * キャラクター別のメモ内容リスト
 * 
 * 特定のキャラクターのすべてのメモ内容を
 * メモ項目IDをキーとして整理した型
 */
export interface CharacterMemoContents {
  /** キャラクターID */
  characterId: string
  /** メモ項目IDをキーとしたメモ内容のマップ */
  contents: Record<string, MemoContent>
}