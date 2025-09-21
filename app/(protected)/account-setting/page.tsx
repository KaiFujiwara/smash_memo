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
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import jaTranslations from './locales/ja.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

// Types
import type { AccountSettingsState } from './types'

// Custom Hooks
import { useAccountData } from './hooks/useAccountData'
import { useAccountActions } from './hooks/useAccountActions'

// Components
import { UserInfoCard } from './components/UserInfoCard'
import { AccountActionsCard } from './components/AccountActionsCard'
import { AccountDialogs } from './components/AccountDialogs'
import Loading from '@/app/loading'

/**
 * アカウント設定ページのメインコンポーネント
 */
export default function AccountSettingsPage() {
  // 翻訳テキスト取得
  const { t } = useProtectedTranslations(jaTranslations, enTranslations, zhTranslations)

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
  useAccountData({ 
    updateState,
    messages: {
      fetchUserError: t.messages.fetchUserError,
      fetchUserConsole: t.errors.fetchUserConsole
    }
  })

  const actions = useAccountActions({ 
    state, 
    updateState,
    messages: {
      signOutSuccess: t.messages.signOutSuccess,
      signOutError: t.messages.signOutError,
      deleteError: t.messages.deleteError,
      signOutConsole: t.errors.signOutConsole,
      deleteConsole: t.errors.deleteConsole
    }
  })

  // === レンダリング ===
  if (state.isLoading) {
    return <Loading />
  }

  if (!state.user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t.userInfo.errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ユーザー情報カード */}
      <UserInfoCard 
        user={state.user}
        userInfo={t.userInfo}
      />

      {/* アカウント操作カード */}
      <AccountActionsCard
        isSigningOut={state.isSigningOut}
        isDeleting={state.isDeleting}
        onSignOut={actions.showSignOutConfirm}
        onDeleteAccount={actions.showDeleteConfirm}
        accountActions={t.accountActions}
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
        dialogs={t.dialogs}
      />
    </div>
  )
}