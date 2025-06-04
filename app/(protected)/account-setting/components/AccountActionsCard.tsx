/**
 * アカウント操作カード
 * 
 * ログアウトとアカウント削除の操作を提供する
 * カードコンポーネントです。
 */

import { Settings, LogOut, Trash2 } from 'lucide-react'

interface AccountActionsCardProps {
  isSigningOut: boolean
  isDeleting: boolean
  onSignOut: () => void
  onDeleteAccount: () => void
}

export function AccountActionsCard({
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
}: AccountActionsCardProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Settings size={20} className="text-indigo-500" />
          アカウント操作
        </h2>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        <div className="space-y-4">
          {/* ログアウト */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">ログアウト</h3>
                <p className="text-sm text-gray-600">アプリからログアウトします</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              disabled={isSigningOut || isDeleting}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

          {/* アカウント削除 */}
          <div className="flex items-center justify-between rounded-lg border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-600" />
              <div>
                <h3 className="font-medium text-gray-900">アカウント削除</h3>
                <p className="text-sm text-gray-600">アカウントとすべてのデータを完全に削除します</p>
              </div>
            </div>
            <button
              onClick={onDeleteAccount}
              disabled={isSigningOut || isDeleting}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  アカウントを削除
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}