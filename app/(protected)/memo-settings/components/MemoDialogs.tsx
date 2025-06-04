/**
 * メモ設定ページのダイアログコンポーネント群
 */

import { AlertTriangle, Keyboard } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

interface MemoDialogsProps {
  showUnsavedWarning: boolean
  showShortcuts: boolean
  showDeleteConfirm: string | null
  isSaving: boolean
  onSaveAndLeave: () => void
  onForceLeave: () => void
  onCloseUnsavedWarning: () => void
  onCloseShortcuts: () => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
}

export function MemoDialogs({
  showUnsavedWarning,
  showShortcuts,
  showDeleteConfirm,
  isSaving,
  onSaveAndLeave,
  onForceLeave,
  onCloseUnsavedWarning,
  onCloseShortcuts,
  onConfirmDelete,
  onCancelDelete
}: MemoDialogsProps) {
  return (
    <>
      {/* 未保存変更の警告ダイアログ */}
      <AnimatePresence>
        {showUnsavedWarning && (
          <div className="modal-overlay fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-yellow-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">未保存の変更があります</h3>
              </div>
              <p className="mb-6 text-gray-600">
                変更内容が保存されていません。このまま離れると変更が失われます。
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onSaveAndLeave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      保存中...
                    </>
                  ) : (
                    '保存して離れる'
                  )}
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onCloseUnsavedWarning}
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    このページに留まる
                  </button>
                  <button
                    onClick={() => {
                      onForceLeave()
                    }}
                    className="flex-1 rounded-full bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition"
                  >
                    変更を破棄して離れる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* キーボードショートカットダイアログ */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="modal-overlay fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-indigo-100 p-2">
                  <Keyboard className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">キーボードショートカット</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>ショートカット表示</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Cmd + /</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>変更を保存</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Cmd + S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>ダイアログを閉じる</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Escape</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>編集を保存</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>編集をキャンセル</span>
                  <kbd className="rounded bg-gray-100 px-2 py-1 text-xs">Escape</kbd>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onCloseShortcuts}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 font-medium text-white shadow-md hover:shadow-lg transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 削除確認ダイアログ */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="modal-overlay fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">項目を削除</h3>
              </div>
              <p className="mb-6 text-gray-600">
                この項目を削除してもよろしいですか？この操作は取り消せません。
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancelDelete}
                  className="rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => onConfirmDelete(showDeleteConfirm)}
                  className="rounded-full bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
} 