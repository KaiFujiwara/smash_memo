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
  accountActions: {
    title: string
    signOut: {
      title: string
      description: string
      button: string
      processing: string
    }
    deleteAccount: {
      title: string
      description: string
      button: string
      processing: string
    }
  }
}

export function AccountActionsCard({
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  accountActions,
}: AccountActionsCardProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Settings size={20} className="text-indigo-500" />
          {accountActions.title}
        </h2>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        <div className="space-y-4">
          {/* ログアウト */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 gap-4">
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-gray-600" />
              <div>
                <h3 className="font-medium text-gray-900">{accountActions.signOut.title}</h3>
                <p className="text-sm text-gray-600">{accountActions.signOut.description}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              disabled={isSigningOut || isDeleting}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              {isSigningOut ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {accountActions.signOut.processing}
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  {accountActions.signOut.button}
                </>
              )}
            </button>
          </div>

          {/* アカウント削除 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 p-4 gap-4">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-600" />
              <div>
                <h3 className="font-medium text-gray-900">{accountActions.deleteAccount.title}</h3>
                <p className="text-sm text-gray-600">{accountActions.deleteAccount.description}</p>
              </div>
            </div>
            <button
              onClick={onDeleteAccount}
              disabled={isSigningOut || isDeleting}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {accountActions.deleteAccount.processing}
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  {accountActions.deleteAccount.button}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}