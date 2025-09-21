/**
 * アカウントデータ取得のカスタムフック
 * 
 * ユーザーの基本情報を取得し、状態に反映します。
 * useEffectを使用して初回レンダリング時にデータを取得します。
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import { getCurrentUserInfo } from '@/services/authService'
import type { AccountSettingsState, UserInfo } from '../types'

interface UseAccountDataProps {
  updateState: (updates: Partial<AccountSettingsState>) => void
  messages: {
    fetchUserError: string
    fetchUserConsole: string
  }
}

export function useAccountData({ updateState, messages }: UseAccountDataProps) {
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const authUser = await getCurrentUserInfo()
        const userInfo: UserInfo = {
          id: authUser.id,
          username: authUser.username,
          email: authUser.email
        }
        updateState({
          user: userInfo,
          isLoading: false,
        })
      } catch (error) {
        console.error(messages.fetchUserConsole, error)
        toast.error(messages.fetchUserError)
        updateState({
          user: null,
          isLoading: false,
        })
      }
    }

    loadUserInfo()
  }, []) // updateStateとmessagesを依存配列から除去
}