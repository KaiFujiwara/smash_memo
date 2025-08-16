/**
 * アカウント操作の確認ダイアログ
 * 
 * ログアウトとアカウント削除の確認ダイアログを提供します。
 * メモ設定画面のダイアログデザインを参考にしています。
 */

import { LogOut, AlertTriangle } from 'lucide-react'

interface AccountDialogsProps {
  showSignOutConfirm: boolean
  showDeleteConfirm: boolean
  isSigningOut: boolean
  isDeleting: boolean
  onConfirmSignOut: () => void
  onConfirmDelete: () => void
  onCancel: () => void
}

export function AccountDialogs({
  showSignOutConfirm,
  showDeleteConfirm,
  isSigningOut,
  isDeleting,
  onConfirmSignOut,
  onConfirmDelete,
  onCancel,
}: AccountDialogsProps) {
  if (!showSignOutConfirm && !showDeleteConfirm) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      data-testid="dialog-backdrop"
    >
      <div 
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {showSignOutConfirm && (
          <>
            <div className="mb-4 flex items-center gap-3 text-blue-600">
              <LogOut size={24} />
              <h2 className="text-xl font-bold">ログアウトの確認</h2>
            </div>
            
            <p className="mb-6 text-gray-700">
              本当にログアウトしますか？
            </p>
            
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button 
                onClick={onCancel}
                disabled={isSigningOut}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                キャンセル
              </button>
              <button 
                onClick={onConfirmSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSigningOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ログアウト中...
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    ログアウト
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {showDeleteConfirm && (
          <>
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold">アカウント削除の確認</h2>
            </div>
            
            <div className="mb-6 text-gray-700">
              <p className="mb-3">
                アカウントとすべてのデータを削除します。
              </p>
              
              <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ 重要な注意事項</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Googleアカウントとの連携は残ります</li>
                  <li>• 再ログイン時は新規アカウントとして作成されます</li>
                  <li>• 削除されたデータは復元できません</li>
                </ul>
              </div>
              
              <p className="font-semibold text-red-600">
                本当に削除しますか？
              </p>
            </div>
            
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button 
                onClick={onCancel}
                disabled={isDeleting}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                キャンセル
              </button>
              <button 
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    削除中...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    削除する
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}