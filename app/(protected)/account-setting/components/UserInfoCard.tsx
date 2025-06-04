/**
 * ユーザー情報表示カード
 * 
 * メモ設定画面のカードデザインを踏襲した
 * ユーザー情報の表示コンポーネントです。
 */

import { User, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import type { UserInfo } from '../types'

interface UserInfoCardProps {
  user: UserInfo
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <User size={20} />
          ユーザー情報
        </h2>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        <div className="space-y-4">
          {/* ユーザー名 */}
          <div className="flex items-center gap-3">
            <User size={16} className="text-gray-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">ユーザー名</p>
              <p className="font-medium text-gray-900">{user.username}</p>
            </div>
          </div>

          {/* メールアドレス */}
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">メールアドレス</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{user.email}</p>
                {user.email_verified === true ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <CheckCircle size={12} />
                    認証済み
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    <AlertCircle size={12} />
                    未認証
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}