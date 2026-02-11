'use client'

import { useState } from 'react'
import { X, Loader2, ImageIcon, RotateCcw, Plus } from 'lucide-react'
import { ImagePreviewModal } from './ImagePreviewModal'
import type { MemoImage, PendingImageAdd, PendingImageDelete } from '@/types/memoImage'

interface MemoImageWithUrl extends MemoImage {
  url?: string
}

interface MemoImageGalleryProps {
  /** サーバーから取得した既存の画像一覧 */
  existingImages: MemoImageWithUrl[]
  /** 追加予定の画像一覧（ローカルプレビュー） */
  pendingAdds: PendingImageAdd[]
  /** 削除予定の画像ID一覧 */
  pendingDeletes: PendingImageDelete[]
  /** 読み込み中フラグ */
  isLoading: boolean
  /** 追加予定の画像をキャンセル */
  onCancelPendingAdd: (tempId: string) => void
  /** 既存画像を削除予定にマーク */
  onMarkForDelete: (imageId: string, s3Key: string) => void
  /** 削除予定をキャンセル */
  onCancelPendingDelete: (imageId: string) => void
  t: {
    deleteImage: string
  }
}

export function MemoImageGallery({
  existingImages,
  pendingAdds,
  pendingDeletes,
  isLoading,
  onCancelPendingAdd,
  onMarkForDelete,
  onCancelPendingDelete,
  t,
}: MemoImageGalleryProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 削除予定かどうかを判定
  const isPendingDelete = (imageId: string) =>
    pendingDeletes.some((p) => p.imageId === imageId)

  // 画像がない場合は何も表示しない
  if (!isLoading && existingImages.length === 0 && pendingAdds.length === 0) {
    return null
  }

  return (
    <>
      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* 既存の画像 */}
            {existingImages.map((image) => {
              const isMarkedForDelete = isPendingDelete(image.id)

              return (
                <div
                  key={image.id}
                  className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 ${
                    isMarkedForDelete ? 'ring-2 ring-red-400' : ''
                  }`}
                >
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className={`w-full h-full object-cover cursor-pointer transition-opacity ${
                        isMarkedForDelete ? 'opacity-40' : ''
                      }`}
                      onClick={() => !isMarkedForDelete && setPreviewUrl(image.url || null)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                    </div>
                  )}

                  {/* 削除予定オーバーレイ */}
                  {isMarkedForDelete && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                      <div className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                    </div>
                  )}

                  {/* ボタン */}
                  {isMarkedForDelete ? (
                    // 削除取り消しボタン
                    <button
                      onClick={() => onCancelPendingDelete(image.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-yellow-500 text-white transition-opacity hover:bg-yellow-600"
                      title="削除を取り消す"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  ) : (
                    // 削除ボタン
                    <button
                      onClick={() => onMarkForDelete(image.id, image.s3Key)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title={t.deleteImage}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}

            {/* 追加予定の画像（ローカルプレビュー） */}
            {pendingAdds.map((pending) => (
              <div
                key={pending.tempId}
                className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 ring-2 ring-green-400"
              >
                <img
                  src={pending.previewUrl}
                  alt={pending.fileName}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewUrl(pending.previewUrl)}
                />

                {/* 追加予定バッジ */}
                <div className="absolute bottom-1 left-1 p-0.5 rounded-full bg-green-500 text-white">
                  <Plus className="w-2 h-2" />
                </div>

                {/* 追加キャンセルボタン */}
                <button
                  onClick={() => onCancelPendingAdd(pending.tempId)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  title="追加を取り消す"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* プレビューモーダル */}
      <ImagePreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </>
  )
}
