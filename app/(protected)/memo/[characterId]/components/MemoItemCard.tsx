'use client'

import { useRef } from 'react'
import { ImagePlus } from 'lucide-react'
import { MemoImageGallery } from './MemoImageGallery'
import { useMemoImages } from '../hooks/useMemoImages'
import { toast } from 'sonner'
import type { MemoItem } from '@/types'

interface MemoContentData {
  id?: string
  content: string
  isEditing: boolean
  originalContent: string
  hasUnsavedChanges: boolean
  lastSavedAt?: Date
}

interface MemoItemCardProps {
  item: MemoItem
  content: MemoContentData
  onContentChange: (memoItemId: string, newContent: string) => void
  onStartEditing: (memoItemId: string) => void
  onFinishEditing: (memoItemId: string) => void
  onSave: (memoItemId: string) => void
  t: {
    memo: {
      unsaved: string
      save: string
      saving: string
      saveTitle: string
      placeholder: string
      emptyPlaceholder: string
    }
    image: {
      addImage: string
      uploading: string
      deleteImage: string
      uploadError: string
      deleteError: string
      uploadSuccess: string
      deleteSuccess: string
    }
  }
}

export function MemoItemCard({
  item,
  content,
  onContentChange,
  onStartEditing,
  onFinishEditing,
  onSave,
  t,
}: MemoItemCardProps) {
  // 画像管理フック（MemoContentのIDが必要）
  const {
    existingImages,
    pendingAdds,
    pendingDeletes,
    isLoading: isImagesLoading,
    isSaving: isImagesSaving,
    changes: imageChanges,
    addPending,
    cancelPendingAdd,
    markForDelete,
    cancelPendingDelete,
    save: saveImages,
    reset: resetImages,
  } = useMemoImages(content.id)

  // ファイル入力の参照
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 変更があるかどうか（メモテキスト + 画像）
  const hasAnyChanges = content.hasUnsavedChanges || imageChanges.hasChanges

  // 保存中かどうか
  const isSaving = isImagesSaving

  // 画像追加ボタンのクリックハンドラ
  const handleAddImageClick = () => {
    fileInputRef.current?.click()
  }

  // ファイル選択ハンドラ（複数ファイル対応）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    let errorMessages: string[] = []

    for (const file of Array.from(files)) {
      const result = addPending(file)
      if (!result.success && result.error) {
        errorMessages.push(`${file.name}: ${result.error}`)
      }
    }

    // エラーがあれば表示
    if (errorMessages.length > 0) {
      toast.error(errorMessages.join('\n'))
    }

    // inputをリセット（同じファイルを再選択できるように）
    e.target.value = ''
  }

  // 統合保存ハンドラ（メモテキスト + 画像）
  const handleSave = async () => {
    // メモテキストの保存
    if (content.hasUnsavedChanges) {
      onSave(item.id)
    }

    // 画像の保存
    if (imageChanges.hasChanges && content.id) {
      const result = await saveImages()
      if (result.success) {
        if (result.uploadedCount > 0 || result.deletedCount > 0) {
          toast.success(t.image.uploadSuccess)
        }
      } else {
        toast.error(result.error || t.image.uploadError)
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      {/* メモ項目ヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-gray-800 dark:text-gray-100">{item.name}</h2>
            {/* 未保存マーク */}
            {hasAnyChanges && !isSaving && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {t.memo.unsaved}
              </span>
            )}
          </div>

          {/* 右側のボタン群 */}
          <div className="flex items-center gap-2">
            {/* 画像追加ボタン（Secondary / Ghost） */}
            <button
              onClick={handleAddImageClick}
              disabled={isSaving}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-sm font-medium
                         text-gray-700 hover:text-gray-900
                         bg-transparent hover:bg-gray-100
                         dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-600
                         transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.image.addImage}
            >
              <ImagePlus className="w-5 h-5" />
              <span className="hidden sm:inline">{t.image.addImage}</span>
            </button>

            {/* 隠しファイル入力（複数選択対応） */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />

            {/* 保存ボタン（Primary / 変更があるときのみ表示） */}
            {hasAnyChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold
                           text-white bg-emerald-600 hover:bg-emerald-700
                           shadow-sm shadow-emerald-600/20
                           transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70
                           disabled:bg-emerald-400 disabled:cursor-not-allowed"
                title={t.memo.saveTitle}
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{t.memo.saving}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{t.memo.save}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* メモ内容 */}
      <div className="p-2 sm:p-4">
        {content.isEditing ? (
          <textarea
            data-memo-id={item.id}
            value={content.content}
            onChange={(e) => onContentChange(item.id, e.target.value)}
            onBlur={() => onFinishEditing(item.id)}
            placeholder={t.memo.placeholder}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            style={{ height: 'auto' }}
            autoFocus
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${target.scrollHeight}px`
            }}
          />
        ) : (
          <div
            className="sm:min-h-[80px] p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-text hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => onStartEditing(item.id)}
          >
            {content.content ? (
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-100 font-mono text-sm">
                {content.content}
              </pre>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">{t.memo.emptyPlaceholder}</p>
            )}
          </div>
        )}

        {/* 画像ギャラリー */}
        <div className="mt-3">
          <MemoImageGallery
            existingImages={existingImages}
            pendingAdds={pendingAdds}
            pendingDeletes={pendingDeletes}
            isLoading={isImagesLoading}
            onCancelPendingAdd={cancelPendingAdd}
            onMarkForDelete={markForDelete}
            onCancelPendingDelete={cancelPendingDelete}
            t={{
              deleteImage: t.image.deleteImage,
            }}
          />
        </div>
      </div>
    </div>
  )
}
