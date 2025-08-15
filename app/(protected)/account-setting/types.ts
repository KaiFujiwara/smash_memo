/**
 * アカウント設定ページの型定義
 */

export interface AccountSettingsState {
  user: UserInfo | null
  isLoading: boolean
  showSignOutConfirm: boolean
  showDeleteConfirm: boolean
  isSigningOut: boolean
  isDeleting: boolean
}

export interface UserInfo {
  id: string
  username: string
  email: string
}

export interface AccountAction {
  type: 'signout' | 'delete'
  title: string
  description: string
  buttonText: string
  confirmText: string
  variant: 'default' | 'destructive'
  isLoading: boolean
}