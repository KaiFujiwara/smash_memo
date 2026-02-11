/**
 * メモ画像関連の型定義
 *
 * MemoContentに紐づく画像のメタデータに関する型を定義しています。
 * 実際の画像ファイルはS3に保存され、ここではそのメタデータのみを管理します。
 */

/**
 * メモ画像の基本情報
 *
 * DynamoDBのMemoImageテーブルに対応する型です。
 * S3に保存された画像のメタデータを管理します。
 */
export interface MemoImage {
  /** 画像の一意識別子 */
  id: string
  /** 親MemoContentのID */
  memoContentId: string
  /** S3オブジェクトキー */
  s3Key: string
  /** 元のファイル名 */
  fileName: string
  /** ファイルサイズ（バイト） */
  fileSize: number
  /** MIMEタイプ（例: image/jpeg） */
  mimeType: string
  /** 表示順序 */
  order: number
  /** 作成日時（ISO文字列） */
  createdAt?: string
  /** 更新日時（ISO文字列） */
  updatedAt?: string
  /** 所有者のユーザーID（Amplifyが自動設定） */
  owner?: string
}

/**
 * メモ画像作成用の入力型
 */
export interface CreateMemoImageInput {
  /** 親MemoContentのID */
  memoContentId: string
  /** S3オブジェクトキー */
  s3Key: string
  /** 元のファイル名 */
  fileName: string
  /** ファイルサイズ（バイト） */
  fileSize: number
  /** MIMEタイプ */
  mimeType: string
  /** 表示順序 */
  order: number
}

/**
 * メモ画像削除用の入力型
 */
export interface DeleteMemoImageInput {
  /** 削除対象のID */
  id: string
}

/**
 * 画像アップロード結果を表す型
 */
export interface MemoImageUploadResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** エラーが発生した場合のメッセージ */
  error?: string
  /** アップロードされた画像情報（成功時のみ） */
  image?: MemoImage
}

/**
 * 画像削除結果を表す型
 */
export interface MemoImageDeleteResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** エラーが発生した場合のメッセージ */
  error?: string
}

/**
 * 画像一覧取得結果を表す型
 */
export interface MemoImageListResult {
  /** 画像一覧 */
  images: MemoImage[]
  /** 画像の総数 */
  count: number
}

/** 1つのMemoContentあたりの最大画像数 */
export const MAX_IMAGES_PER_MEMO = 100

/** 1枚あたりの最大ファイルサイズ（バイト） */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/** サポートするMIMEタイプ */
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

/**
 * 追加予定の画像（ローカルプレビュー用）
 *
 * 保存ボタンを押すまでS3にはアップロードされません。
 * ローカルでプレビュー表示するためのFileオブジェクトとプレビューURLを保持します。
 */
export interface PendingImageAdd {
  /** 一時的な識別子（クライアント側で生成したUUID） */
  tempId: string
  /** アップロード対象のファイル */
  file: File
  /** ローカルプレビュー用のオブジェクトURL */
  previewUrl: string
  /** ファイル名 */
  fileName: string
  /** ファイルサイズ（バイト） */
  fileSize: number
  /** MIMEタイプ */
  mimeType: string
}

/**
 * 削除予定の画像
 *
 * 保存ボタンを押すまで実際には削除されません。
 * UIでは取り消し線で表示されます。
 */
export interface PendingImageDelete {
  /** 削除対象の画像ID */
  imageId: string
  /** S3オブジェクトキー（削除時に必要） */
  s3Key: string
}

/**
 * メモ画像の状態管理用の型
 *
 * 既存の画像、追加予定の画像、削除予定の画像を管理します。
 */
export interface MemoImageState {
  /** サーバーから取得した既存の画像一覧 */
  existingImages: MemoImage[]
  /** 追加予定の画像一覧（ローカルプレビュー） */
  pendingAdds: PendingImageAdd[]
  /** 削除予定の画像ID一覧 */
  pendingDeletes: PendingImageDelete[]
  /** 署名付きURLのキャッシュ（s3Key -> url） */
  signedUrls: Record<string, string>
  /** 読み込み中フラグ */
  isLoading: boolean
  /** エラーメッセージ */
  error?: string
}

/**
 * 画像の変更があるかどうかを判定するためのヘルパー型
 */
export interface MemoImageChanges {
  /** 変更があるかどうか */
  hasChanges: boolean
  /** 追加予定の件数 */
  addCount: number
  /** 削除予定の件数 */
  deleteCount: number
}

/**
 * 画像の一括保存結果
 */
export interface MemoImageSaveResult {
  /** 操作が成功したかどうか */
  success: boolean
  /** エラーが発生した場合のメッセージ */
  error?: string
  /** アップロードに成功した画像数 */
  uploadedCount: number
  /** 削除に成功した画像数 */
  deletedCount: number
  /** アップロードに失敗した画像数 */
  uploadFailedCount: number
  /** 削除に失敗した画像数 */
  deleteFailedCount: number
}
