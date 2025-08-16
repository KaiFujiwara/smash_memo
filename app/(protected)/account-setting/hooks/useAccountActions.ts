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
    // ブラウザ確認ダイアログで詳細な警告を表示
    const confirmed = window.confirm(
      'アカウントとすべてのデータを削除します。\n\n' +
      '⚠️ 重要な注意事項:\n' +
      '• Googleアカウントとの連携は残ります\n' +
      '• 再ログイン時は新規アカウントとして作成されます\n' +
      '• 削除されたデータは復元できません\n\n' +
      '本当に削除しますか？'
    )
    
    if (!confirmed) return
    
    updateState({ isDeleting: true })
    
    try {
      await deleteUser()
      
      try {
        await signOut()
      } catch (signOutError) {
        console.error('ログアウトエラー:', signOutError)
        // ログアウトエラーがあってもリダイレクトは実行
      }
      
      // 削除完了フラグをローカルストレージに保存
      localStorage.setItem('accountDeleted', 'true')
      router.push('/login')
      
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