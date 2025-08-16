'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        }
      case 'warning':
        return {
          icon: 'text-yellow-600',
          button: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
        }
      default:
        return {
          icon: 'text-blue-600',
          button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      style={{ margin: 0 }}
    >
      <div 
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`mb-4 flex items-center gap-3 ${styles.icon}`}>
          <AlertTriangle size={24} />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <p className="mb-6 text-gray-700 whitespace-pre-line">
          {message}
        </p>
        
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${styles.button}`}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                処理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}