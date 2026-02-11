'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  getMemoImagesByContent,
  getMemoImageUrl,
  uploadMemoImage,
  deleteMemoImage,
  validateImageFile,
} from '@/services/memoImageService'
import type {
  MemoImage,
  PendingImageAdd,
  PendingImageDelete,
  MemoImageChanges,
  MemoImageSaveResult,
} from '@/types/memoImage'
import { MAX_IMAGES_PER_MEMO } from '@/types/memoImage'

interface MemoImageWithUrl extends MemoImage {
  url?: string
}

interface UseMemoImagesResult {
  /** サーバーから取得した既存の画像一覧（署名付きURL付き） */
  existingImages: MemoImageWithUrl[]
  /** 追加予定の画像一覧（ローカルプレビュー） */
  pendingAdds: PendingImageAdd[]
  /** 削除予定の画像ID一覧 */
  pendingDeletes: PendingImageDelete[]
  /** 読み込み中フラグ */
  isLoading: boolean
  /** 保存中フラグ */
  isSaving: boolean
  /** エラーメッセージ */
  error: string | null
  /** 変更情報 */
  changes: MemoImageChanges
  /** 画像一覧を読み込み */
  loadImages: () => Promise<void>
  /** 画像を追加予定に追加（ローカルプレビューのみ） */
  addPending: (file: File) => { success: boolean; error?: string }
  /** 追加予定の画像をキャンセル */
  cancelPendingAdd: (tempId: string) => void
  /** 既存画像を削除予定にマーク */
  markForDelete: (imageId: string, s3Key: string) => void
  /** 削除予定をキャンセル */
  cancelPendingDelete: (imageId: string) => void
  /** 変更を一括保存（S3アップロード・削除を実行） */
  save: () => Promise<MemoImageSaveResult>
  /** 変更をすべてリセット */
  reset: () => void
  /** 単一画像のURL取得 */
  getImageUrl: (s3Key: string) => Promise<string>
}

export function useMemoImages(memoContentId: string | undefined): UseMemoImagesResult {
  const [existingImages, setExistingImages] = useState<MemoImageWithUrl[]>([])
  const [pendingAdds, setPendingAdds] = useState<PendingImageAdd[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<PendingImageDelete[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // クリーンアップ用: 最新のpendingAddsを参照するためのref
  const pendingAddsRef = useRef<PendingImageAdd[]>([])
  // レース対策用: 最新のリクエストIDを保持
  const latestRequestIdRef = useRef<string>()
  // 二重保存防止用: 同期的にチェックするためのref
  const isSavingRef = useRef(false)

  // pendingAddsが変わるたびにrefを更新
  useEffect(() => {
    pendingAddsRef.current = pendingAdds
  }, [pendingAdds])

  // 変更情報を計算
  const changes = useMemo<MemoImageChanges>(() => {
    const addCount = pendingAdds.length
    const deleteCount = pendingDeletes.length
    return {
      hasChanges: addCount > 0 || deleteCount > 0,
      addCount,
      deleteCount,
    }
  }, [pendingAdds.length, pendingDeletes.length])

  // 画像一覧を読み込み
  const loadImages = useCallback(async () => {
    if (!memoContentId) {
      // レース対策: in-flightリクエストを無効化
      latestRequestIdRef.current = uuidv4()
      setExistingImages([])
      setIsLoading(false)
      setError(null)
      return
    }

    // レース対策: このリクエストのIDを生成（uuidv4で環境互換性を確保）
    const requestId = uuidv4()
    latestRequestIdRef.current = requestId

    setIsLoading(true)
    setError(null)

    try {
      const imageList = await getMemoImagesByContent(memoContentId)

      // レース対策: 古いリクエストの結果は破棄
      if (latestRequestIdRef.current !== requestId) {
        return
      }

      // 署名付きURLを取得
      const imagesWithUrls = await Promise.all(
        imageList.map(async (image) => {
          try {
            const url = await getMemoImageUrl(image.s3Key)
            return { ...image, url }
          } catch {
            return { ...image, url: undefined }
          }
        })
      )

      // レース対策: URL取得後も再チェック
      if (latestRequestIdRef.current !== requestId) {
        return
      }

      setExistingImages(imagesWithUrls)
    } catch (err) {
      // レース対策: エラー時も古いリクエストなら無視
      if (latestRequestIdRef.current !== requestId) {
        return
      }
      console.error('画像の読み込みに失敗:', err)
      setError('画像の読み込みに失敗しました')
    } finally {
      // レース対策: 最新リクエストのみローディング解除
      if (latestRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [memoContentId])

  // 初回読み込み
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // memoContentIdが変わったら pending状態をリセット（プレビューURL解放も行う）
  useEffect(() => {
    // 切り替え前のプレビューURLを解放
    pendingAddsRef.current.forEach((pending) => {
      URL.revokeObjectURL(pending.previewUrl)
    })
    setPendingAdds([])
    setPendingDeletes([])
    // 前メモの画像を即時クリア（UX: ロード完了まで古い画像を表示しない）
    setExistingImages([])
  }, [memoContentId])

  // 画像を追加予定に追加（ローカルプレビューのみ、S3にはアップロードしない）
  const addPending = useCallback(
    (file: File): { success: boolean; error?: string } => {
      // バリデーション
      const validation = validateImageFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // 100件制限チェック（既存 + 追加予定 - 削除予定）
      const currentCount =
        existingImages.length + pendingAdds.length - pendingDeletes.length
      if (currentCount >= MAX_IMAGES_PER_MEMO) {
        return { success: false, error: '画像は100件まで添付できます' }
      }

      // ローカルプレビューURLを生成
      const previewUrl = URL.createObjectURL(file)

      const pendingImage: PendingImageAdd = {
        tempId: uuidv4(),
        file,
        previewUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }

      setPendingAdds((prev) => [...prev, pendingImage])
      return { success: true }
    },
    [existingImages.length, pendingAdds.length, pendingDeletes.length]
  )

  // 追加予定の画像をキャンセル
  const cancelPendingAdd = useCallback((tempId: string) => {
    setPendingAdds((prev) => {
      const target = prev.find((p) => p.tempId === tempId)
      if (target) {
        // メモリリーク防止: オブジェクトURLを解放
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((p) => p.tempId !== tempId)
    })
  }, [])

  // 既存画像を削除予定にマーク
  const markForDelete = useCallback((imageId: string, s3Key: string) => {
    setPendingDeletes((prev) => {
      // すでにマーク済みの場合は追加しない
      if (prev.some((p) => p.imageId === imageId)) {
        return prev
      }
      return [...prev, { imageId, s3Key }]
    })
  }, [])

  // 削除予定をキャンセル
  const cancelPendingDelete = useCallback((imageId: string) => {
    setPendingDeletes((prev) => prev.filter((p) => p.imageId !== imageId))
  }, [])

  // 変更を一括保存（S3アップロード・削除を実行）
  const save = useCallback(async (): Promise<MemoImageSaveResult> => {
    // 二重保存ガード（同期的にチェック）
    if (isSavingRef.current) {
      return {
        success: false,
        error: '保存処理中です',
        uploadedCount: 0,
        deletedCount: 0,
        uploadFailedCount: 0,
        deleteFailedCount: 0,
      }
    }

    if (!memoContentId) {
      return {
        success: false,
        error: 'メモが保存されていません',
        uploadedCount: 0,
        deletedCount: 0,
        uploadFailedCount: 0,
        deleteFailedCount: 0,
      }
    }

    // 同期的にフラグを立てる（連打対策）
    isSavingRef.current = true

    // スナップショットを取る（save中の状態変更に影響されないよう）
    const pendingAddsSnapshot = [...pendingAdds]
    const pendingDeletesSnapshot = [...pendingDeletes]
    const existingImagesCountSnapshot = existingImages.length
    // スナップショットのtempIdを記録（後で除去する際に使用）
    const snapshotAddTempIds = new Set(pendingAddsSnapshot.map((p) => p.tempId))
    const snapshotDeleteImageIds = new Set(pendingDeletesSnapshot.map((p) => p.imageId))

    setIsSaving(true)
    setError(null)

    let uploadedCount = 0
    let deletedCount = 0
    let uploadFailedCount = 0
    let deleteFailedCount = 0

    try {
      // 1. 削除処理（先に削除して枠を空ける）
      // 各削除を個別にtry/catchで包み、throwしてもPromise.allが落ちないようにする
      const deletePromises = pendingDeletesSnapshot.map(async ({ imageId, s3Key }) => {
        try {
          const result = await deleteMemoImage(imageId, s3Key)
          if (result.success) {
            deletedCount++
          } else {
            deleteFailedCount++
          }
          return result
        } catch {
          deleteFailedCount++
          return { success: false, error: '削除中にエラーが発生しました' }
        }
      })

      await Promise.all(deletePromises)

      // 2. アップロード処理
      // 現在のDB上の画像数を計算（スナップショットを使用）
      let currentDbCount = existingImagesCountSnapshot - deletedCount

      for (const pending of pendingAddsSnapshot) {
        const result = await uploadMemoImage(memoContentId, pending.file, currentDbCount)
        // プレビューURLは成否に関わらず解放（メモリリーク防止）
        URL.revokeObjectURL(pending.previewUrl)
        if (result.success) {
          uploadedCount++
          currentDbCount++
        } else {
          uploadFailedCount++
        }
      }

      // 3. 状態をリセット（スナップショットに含まれないものは残す）
      setPendingAdds((prev) => prev.filter((p) => !snapshotAddTempIds.has(p.tempId)))
      setPendingDeletes((prev) => prev.filter((p) => !snapshotDeleteImageIds.has(p.imageId)))

      // 4. 最新の画像一覧を再読み込み
      await loadImages()

      const hasErrors = uploadFailedCount > 0 || deleteFailedCount > 0

      return {
        success: !hasErrors,
        error: hasErrors
          ? `アップロード失敗: ${uploadFailedCount}件, 削除失敗: ${deleteFailedCount}件`
          : undefined,
        uploadedCount,
        deletedCount,
        uploadFailedCount,
        deleteFailedCount,
      }
    } catch (err) {
      console.error('画像の保存に失敗:', err)
      // 例外時: pendingAddsのプレビューURLを全て解放（スナップショットを使用）
      pendingAddsSnapshot.forEach((pending) => {
        URL.revokeObjectURL(pending.previewUrl)
      })
      // スナップショットに含まれるものだけ除去
      setPendingAdds((prev) => prev.filter((p) => !snapshotAddTempIds.has(p.tempId)))
      setPendingDeletes((prev) => prev.filter((p) => !snapshotDeleteImageIds.has(p.imageId)))
      return {
        success: false,
        error: '画像の保存に失敗しました',
        uploadedCount,
        deletedCount,
        uploadFailedCount,
        deleteFailedCount,
      }
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [memoContentId, pendingAdds, pendingDeletes, existingImages.length, loadImages])

  // 変更をすべてリセット
  const reset = useCallback(() => {
    // プレビューURLを全て解放（refを使用して最新の状態を参照）
    pendingAddsRef.current.forEach((pending) => {
      URL.revokeObjectURL(pending.previewUrl)
    })
    setPendingAdds([])
    setPendingDeletes([])
    setError(null)
  }, [])

  // 単一画像のURL取得
  const getImageUrl = useCallback(async (s3Key: string): Promise<string> => {
    return getMemoImageUrl(s3Key)
  }, [])

  // クリーンアップ: コンポーネントのアンマウント時にプレビューURLを解放
  useEffect(() => {
    return () => {
      // refを使用して最新のpendingAddsを参照（空配列キャプチャ問題を回避）
      pendingAddsRef.current.forEach((pending) => {
        URL.revokeObjectURL(pending.previewUrl)
      })
    }
  }, [])

  return {
    existingImages,
    pendingAdds,
    pendingDeletes,
    isLoading,
    isSaving,
    error,
    changes,
    loadImages,
    addPending,
    cancelPendingAdd,
    markForDelete,
    cancelPendingDelete,
    save,
    reset,
    getImageUrl,
  }
}
