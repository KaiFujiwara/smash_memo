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
}

export function useAccountData({ updateState }: UseAccountDataProps) {
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const authUser = await getCurrentUserInfo()
        const userInfo: UserInfo = {
          id: authUser.id,
          username: authUser.username,
          email: authUser.email,
          displayName: authUser.displayName,
          email_verified: authUser.email_verified,
        }
        updateState({
          user: userInfo,
          isLoading: false,
        })
      } catch (error) {
        console.error('ユーザー情報の取得に失敗:', error)
        toast.error('ユーザー情報の取得に失敗しました')
        updateState({
          user: null,
          isLoading: false,
        })
      }
    }

    loadUserInfo()
  }, []) // updateStateを依存配列から除去
}