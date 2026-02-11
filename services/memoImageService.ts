/**
 * メモ画像サービス
 *
 * MemoImageに関するビジネスロジックを集約したサービス層です。
 * AWS Amplify Gen2のモデルベースAPIとStorageを使用します。
 */

import { generateClient } from 'aws-amplify/data'
import { uploadData, remove, getUrl } from 'aws-amplify/storage'
import { fetchAuthSession } from 'aws-amplify/auth'
import { v4 as uuidv4 } from 'uuid'
import type { Schema } from '@/amplify/data/resource'
import {
  MAX_IMAGES_PER_MEMO,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES,
} from '@/types/memoImage'
import type {
  MemoImage,
  MemoImageUploadResult,
  MemoImageDeleteResult,
} from '@/types/memoImage'

// Amplify Data クライアント（型安全）
const client = generateClient<Schema>()

/**
 * 署名付きURLキャッシュ
 *
 * S3署名付きURLは有効期限があるため、有効期限内であればキャッシュを使用します。
 * これにより、同じ画像を何度も表示する際のAPI呼び出しを削減できます。
 */
interface CachedUrl {
  url: string
  expiresAt: number // Unix timestamp (ms)
}

// URLキャッシュ（s3Key → CachedUrl）
const urlCache = new Map<string, CachedUrl>()

// キャッシュの有効期限（30分）- 署名付きURLの有効期限（1時間）より短く設定
const CACHE_DURATION_MS = 30 * 60 * 1000

/**
 * キャッシュされたURLを取得（有効期限切れの場合はnull）
 */
function getCachedUrl(s3Key: string): string | null {
  const cached = urlCache.get(s3Key)
  if (!cached) return null

  // 有効期限チェック（5分のバッファを持たせる）
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000
  if (cached.expiresAt - bufferMs < now) {
    urlCache.delete(s3Key)
    return null
  }

  return cached.url
}

/**
 * URLをキャッシュに保存
 */
function setCachedUrl(s3Key: string, url: string): void {
  urlCache.set(s3Key, {
    url,
    expiresAt: Date.now() + CACHE_DURATION_MS,
  })
}

/**
 * 指定されたs3Keyのキャッシュを削除
 */
export function clearUrlCache(s3Key?: string): void {
  if (s3Key) {
    urlCache.delete(s3Key)
  } else {
    urlCache.clear()
  }
}

/**
 * Cognito Identity IDを取得
 */
async function getIdentityId(): Promise<string> {
  const session = await fetchAuthSession()
  const identityId = session.identityId
  if (!identityId) {
    throw new Error('Identity IDが取得できませんでした')
  }
  return identityId
}

/**
 * Amplifyモデルを MemoImage 型に変換
 */
function toMemoImage(item: Schema['MemoImage']['type']): MemoImage {
  return {
    id: item.id,
    memoContentId: item.memoContentId,
    s3Key: item.s3Key,
    fileName: item.fileName,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    order: item.order,
    createdAt: item.createdAt ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
    owner: item.owner ?? undefined,
  }
}

/**
 * MIMEタイプがサポートされているか確認
 */
function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mimeType as typeof SUPPORTED_MIME_TYPES[number])
}

/**
 * 指定されたMemoContentの画像一覧を取得します
 *
 * @param memoContentId - MemoContentのID
 * @returns Promise<MemoImage[]> 画像のリスト
 */
export async function getMemoImagesByContent(memoContentId: string): Promise<MemoImage[]> {
  try {
    const { data: items, errors } = await client.models.MemoImage.memoImagesByMemoContent({
      memoContentId,
    })

    if (errors) {
      console.error('メモ画像の取得エラー:', errors)
      throw new Error('メモ画像の取得に失敗しました')
    }

    return (items || []).map(toMemoImage)
  } catch (error) {
    console.error('メモ画像の取得に失敗:', error)
    throw new Error('メモ画像の取得に失敗しました')
  }
}

/**
 * 画像の署名付きURLを取得します（キャッシュ対応）
 *
 * キャッシュに有効なURLがあればそれを返し、なければ新規取得してキャッシュします。
 * これにより、同じ画像を繰り返し表示する際のAPI呼び出しを削減できます。
 *
 * @param s3Key - S3オブジェクトキー
 * @param expiresIn - URL有効期限（秒）デフォルト3600秒（1時間）
 * @returns Promise<string> 署名付きURL
 */
export async function getMemoImageUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  // 1. キャッシュをチェック
  const cachedUrl = getCachedUrl(s3Key)
  if (cachedUrl) {
    return cachedUrl
  }

  // 2. キャッシュになければ新規取得
  try {
    const result = await getUrl({
      path: s3Key,
      options: {
        expiresIn,
      },
    })
    const url = result.url.toString()

    // 3. キャッシュに保存
    setCachedUrl(s3Key, url)

    return url
  } catch (error) {
    console.error('画像URLの取得に失敗:', error)
    throw new Error('画像URLの取得に失敗しました')
  }
}

/**
 * ファイルのバリデーションを行います
 *
 * @param file - バリデーション対象のファイル
 * @returns { valid: boolean; error?: string }
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // MIMEタイプチェック
  if (!isSupportedMimeType(file.type)) {
    return {
      valid: false,
      error: 'サポートされていない画像形式です。JPEG, PNG, GIF, WebPのみ対応しています。',
    }
  }

  // ファイルサイズチェック（5MB）
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: '画像は5MB以下にしてください',
    }
  }

  return { valid: true }
}

/**
 * 画像をアップロードします
 *
 * バリデーション:
 * - ファイルサイズ: 5MB以下
 * - 枚数制限: 100件以下
 * - MIMEタイプ: JPEG, PNG, GIF, WebP
 *
 * @param memoContentId - MemoContentのID
 * @param file - アップロードするファイル
 * @param currentImageCount - 現在の画像数（追加予定分を含む）
 * @returns Promise<MemoImageUploadResult> アップロード結果
 */
export async function uploadMemoImage(
  memoContentId: string,
  file: File,
  currentImageCount: number = 0
): Promise<MemoImageUploadResult> {
  try {
    // 1. ファイルバリデーション
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 2. 100件制限チェック
    if (currentImageCount >= MAX_IMAGES_PER_MEMO) {
      return {
        success: false,
        error: '画像は100件まで添付できます',
      }
    }

    // 3. S3にアップロード
    const identityId = await getIdentityId()
    const extension = file.name.split('.').pop() || 'jpg'
    const s3Key = `memo-images/${identityId}/${memoContentId}/${uuidv4()}.${extension}`

    await uploadData({
      path: s3Key,
      data: file,
      options: {
        contentType: file.type,
      },
    }).result

    // 4. DynamoDBにメタデータを保存
    const nextOrder = currentImageCount + 1
    const { data: createdImage, errors } = await client.models.MemoImage.create({
      memoContentId,
      s3Key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      order: nextOrder,
    })

    if (errors || !createdImage) {
      // S3のファイルをロールバック
      await remove({ path: s3Key })
      console.error('メタデータ保存エラー:', errors)
      throw new Error('メモ画像のメタデータ保存に失敗しました')
    }

    return {
      success: true,
      image: toMemoImage(createdImage),
    }
  } catch (error) {
    console.error('画像アップロードに失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '画像のアップロードに失敗しました',
    }
  }
}

/**
 * 画像を削除します
 *
 * @param imageId - 画像のID
 * @param s3Key - S3オブジェクトキー
 * @returns Promise<MemoImageDeleteResult> 削除結果
 */
export async function deleteMemoImage(
  imageId: string,
  s3Key: string
): Promise<MemoImageDeleteResult> {
  try {
    // 1. DynamoDBからメタデータを削除
    const { errors } = await client.models.MemoImage.delete({ id: imageId })

    if (errors) {
      console.error('メタデータ削除エラー:', errors)
      throw new Error('メモ画像のメタデータ削除に失敗しました')
    }

    // 2. S3からファイルを削除
    await remove({ path: s3Key })

    // 3. URLキャッシュをクリア
    clearUrlCache(s3Key)

    return { success: true }
  } catch (error) {
    console.error('画像削除に失敗:', error)
    return {
      success: false,
      error: '画像の削除に失敗しました',
    }
  }
}

/**
 * 指定されたMemoContentに関連するすべての画像を削除します（カスケード削除用）
 *
 * @param memoContentId - MemoContentのID
 * @returns Promise<{ success: boolean; deletedCount: number; error?: string }>
 */
export async function deleteMemoImagesByContent(memoContentId: string): Promise<{
  success: boolean
  deletedCount: number
  error?: string
}> {
  try {
    // 1. 関連する画像を取得
    const images = await getMemoImagesByContent(memoContentId)

    if (images.length === 0) {
      return {
        success: true,
        deletedCount: 0,
      }
    }

    // 2. 全ての画像を並列削除
    const deletePromises = images.map((image) =>
      deleteMemoImage(image.id, image.s3Key)
    )

    const results = await Promise.all(deletePromises)
    const failedCount = results.filter((r) => !r.success).length

    if (failedCount > 0) {
      return {
        success: false,
        deletedCount: images.length - failedCount,
        error: `${failedCount}件の画像削除に失敗しました`,
      }
    }

    return {
      success: true,
      deletedCount: images.length,
    }
  } catch (error) {
    console.error('メモ画像の一括削除に失敗:', error)
    return {
      success: false,
      deletedCount: 0,
      error: 'メモ画像の削除に失敗しました',
    }
  }
}
