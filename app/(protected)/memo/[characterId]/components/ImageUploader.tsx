'use client'

import { useRef, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { SUPPORTED_MIME_TYPES } from '@/types/memoImage'

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>
  isUploading: boolean
  disabled?: boolean
  t: {
    addImage: string
    uploading: string
  }
}

export function ImageUploader({ onUpload, isUploading, disabled, t }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onUpload(file)
      // inputをリセット（同じファイルを再度選択できるように）
      e.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await onUpload(file)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || isUploading}
        className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed
          flex flex-col items-center justify-center gap-1
          transition-all duration-200
          ${isDragOver
            ? 'border-blue-500 bg-blue-50'
            : disabled || isUploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          }
        `}
        title={t.addImage}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-xs text-gray-500">{t.uploading}</span>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 hidden sm:block">{t.addImage}</span>
          </>
        )}
      </button>
    </>
  )
}
