/**
 * アカウント設定ページのヘッダーコンポーネント
 * 
 * メモ設定画面と同じデザインパターンを使用した
 * シンプルなヘッダーです。
 */

import { UserCog } from 'lucide-react'

export function AccountHeader() {
  return (
    <div className="mb-6">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
        <UserCog size={24} className="text-indigo-600" />
        アカウント設定
      </h1>
    </div>
  )
}