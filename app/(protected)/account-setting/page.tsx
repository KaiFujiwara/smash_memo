/**
 * アカウント設定ページ（リファクタリング版）
 * 
 * メモ設定画面と同様のデザインパターンを使用した
 * モダンなアカウント設定ページです。
 * 
 * 主な機能：
 * 1. ユーザー情報の表示
 * 2. ログアウト
 * 3. アカウント削除
 */

'use client'

import { useState, useCallback } from 'react'

// Types
import type { AccountSettingsState } from './types'

// Custom Hooks
import { useAccountData } from './hooks/useAccountData'
import { useAccountActions } from './hooks/useAccountActions'

// Components
import { AccountHeader } from './components/AccountHeader'
import { UserInfoCard } from './components/UserInfoCard'
import { AccountActionsCard } from './components/AccountActionsCard'
import { AccountDialogs } from './components/AccountDialogs'

/**
 * アカウント設定ページのメインコンポーネント
 */
export default function AccountSettingsPage() {
  // === 状態管理 ===
  const [state, setState] = useState<AccountSettingsState>({
    user: null,
    isLoading: true,
    showSignOutConfirm: false,
    showDeleteConfirm: false,
    isSigningOut: false,
    isDeleting: false,
  })

  const updateState = useCallback((updates: Partial<AccountSettingsState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // === カスタムフック ===
  useAccountData({ updateState })

  const actions = useAccountActions({ state, updateState })

  // === レンダリング ===
  if (state.isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!state.user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ユーザー情報を取得できませんでした</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <AccountHeader />

      {/* ユーザー情報カード */}
      <UserInfoCard user={state.user} />

      {/* アカウント操作カード */}
      <AccountActionsCard
        isSigningOut={state.isSigningOut}
        isDeleting={state.isDeleting}
        onSignOut={actions.showSignOutConfirm}
        onDeleteAccount={actions.showDeleteConfirm}
      />

      {/* 確認ダイアログ */}
      <AccountDialogs
        showSignOutConfirm={state.showSignOutConfirm}
        showDeleteConfirm={state.showDeleteConfirm}
        isSigningOut={state.isSigningOut}
        isDeleting={state.isDeleting}
        onConfirmSignOut={actions.handleSignOut}
        onConfirmDelete={actions.handleDeleteAccount}
        onCancel={actions.cancelAction}
      />
    </div>
  )
}