/**
 * 型定義のエクスポートファイル
 * 
 * アプリケーション全体で使用される型定義を一箇所から
 * エクスポートすることで、インポート文の管理を簡素化します。
 */

// 認証関連の型をエクスポート
export type {
  User,
  AuthContextType,
  AuthError,
  SignInResult,
  AuthStateChangeEvent
} from './auth'

// メモ項目関連の型をエクスポート
export type {
  MemoItem,
  CreateMemoItemInput,
  UpdateMemoItemInput,
  DeleteMemoItemInput,
  DragDropResult,
  BulkUpdateMemoItemInput,
  MemoItemOperationResult,
  MemoItemListResult
} from './memo'

// キャラクター関連の型をエクスポート
export type {
  Character
} from './character'

// メモ内容関連の型をエクスポート
export type {
  MemoContent,
  CreateMemoContentInput,
  UpdateMemoContentInput,
  DeleteMemoContentInput,
  MemoContentOperationResult,
  CharacterMemoContents
} from './memoContent'

// メモ画像関連の型をエクスポート
export type {
  MemoImage,
  CreateMemoImageInput,
  DeleteMemoImageInput,
  MemoImageUploadResult,
  MemoImageDeleteResult,
  MemoImageListResult
} from './memoImage'

export {
  MAX_IMAGES_PER_MEMO,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES
} from './memoImage' 