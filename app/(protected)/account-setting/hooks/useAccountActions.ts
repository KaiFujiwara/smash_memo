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
  messages: {
    signOutSuccess: string
    signOutError: string
    deleteError: string
    signOutConsole: string
    deleteConsole: string
  }
}

export function useAccountActions({ state, updateState, messages }: UseAccountActionsProps) {
  const router = useRouter()

  // ログアウト処理
  const handleSignOut = useCallback(async () => {
    updateState({ isSigningOut: true })
    
    try {
      await signOut()
      router.push('/login')
      toast.success(messages.signOutSuccess)
    } catch (error) {
      console.error(messages.signOutConsole, error)
      toast.error(messages.signOutError)
      updateState({ 
        isSigningOut: false,
        showSignOutConfirm: false 
      })
    }
  }, [router, updateState, messages])

  // アカウント削除処理
  const handleDeleteAccount = useCallback(async () => {
    updateState({ isDeleting: true })
    
    try {
      await deleteUser()
      
      try {
        await signOut()
      } catch (signOutError) {
        console.error(messages.signOutConsole, signOutError)
        // ログアウトエラーがあってもリダイレクトは実行
      }
      
      // 削除完了フラグをローカルストレージに保存
      localStorage.setItem('accountDeleted', 'true')
      router.push('/login')
      
    } catch (error) {
      console.error(messages.deleteConsole, error)
      toast.error(messages.deleteError)
      updateState({ 
        isDeleting: false,
        showDeleteConfirm: false 
      })
    }
  }, [router, updateState, messages])

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