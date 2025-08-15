/**
 * ユーザー情報表示カード
 * 
 * メモ設定画面のカードデザインを踏襲した
 * ユーザー情報の表示コンポーネントです。
 */

import { User, Mail } from 'lucide-react'
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
          {/* メールアドレス */}
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">メールアドレス</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}