/**
 * アカウント操作のカスタムフック
 * 
 * ログアウトとアカウント削除の操作を管理します。
 * 確認ダイアログの制御とAPIコールの実行を担当します。
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signOut, deleteUser } from 'aws-amplify/auth'
import type { AccountSettingsState } from '../types'

interface UseAccountActionsProps {
  state: AccountSettingsState
  updateState: (updates: Partial<AccountSettingsState>) => void
}

export function useAccountActions({ state, updateState }: UseAccountActionsProps) {
  const router = useRouter()

  // ログアウト処理
  const handleSignOut = useCallback(async () => {
    updateState({ isSigningOut: true })
    
    try {
      await signOut()
      router.push('/login')
      toast.success('ログアウトしました')
    } catch (error) {
      console.error('ログアウトエラー:', error)
      toast.error('ログアウトに失敗しました')
      updateState({ 
        isSigningOut: false,
        showSignOutConfirm: false 
      })
    }
  }, [router, updateState])

  // アカウント削除処理
  const handleDeleteAccount = useCallback(async () => {
    updateState({ isDeleting: true })
    
    try {
      await deleteUser()
      await signOut()
      router.push('/login')
      toast.success('アカウントを削除しました')
    } catch (error) {
      console.error('アカウント削除エラー:', error)
      toast.error('アカウントの削除に失敗しました')
      updateState({ 
        isDeleting: false,
        showDeleteConfirm: false 
      })
    }
  }, [router, updateState])

  // ログアウト確認ダイアログ表示
  const showSignOutConfirm = useCallback(() => {
    updateState({ showSignOutConfirm: true })
  }, [updateState])

  // アカウント削除確認ダイアログ表示
  const showDeleteConfirm = useCallback(() => {
    updateState({ showDeleteConfirm: true })
  }, [updateState])

  // ダイアログキャンセル
  const cancelAction = useCallback(() => {
    updateState({ 
      showSignOutConfirm: false,
      showDeleteConfirm: false 
    })
  }, [updateState])

  return {
    handleSignOut,
    handleDeleteAccount,
    showSignOutConfirm,
    showDeleteConfirm,
    cancelAction,
  }
}