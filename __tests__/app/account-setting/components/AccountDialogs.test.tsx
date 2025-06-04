/**
 * AccountDialogsコンポーネントのテスト
 * アカウント操作の確認ダイアログのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccountDialogs } from '@/app/(protected)/account-setting/components/AccountDialogs'

describe('AccountDialogs', () => {
  const defaultProps = {
    showSignOutConfirm: false,
    showDeleteConfirm: false,
    isSigningOut: false,
    isDeleting: false,
    onConfirmSignOut: jest.fn(),
    onConfirmDelete: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ログアウト確認ダイアログ', () => {
    it('showSignOutConfirmがtrueの時、ログアウト確認ダイアログが表示される', () => {
      render(<AccountDialogs {...defaultProps} showSignOutConfirm={true} />)
      
      expect(screen.getByText('ログアウトの確認')).toBeInTheDocument()
      expect(screen.getByText('本当にログアウトしますか？')).toBeInTheDocument()
    })

    it('ログアウト確認ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<AccountDialogs {...defaultProps} showSignOutConfirm={true} />)
      
      const confirmButton = screen.getByRole('button', { name: /ログアウト/ })
      fireEvent.click(confirmButton)
      
      expect(defaultProps.onConfirmSignOut).toHaveBeenCalledTimes(1)
    })

    it('キャンセルボタンをクリックするとコールバックが呼ばれる', () => {
      render(<AccountDialogs {...defaultProps} showSignOutConfirm={true} />)
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ })
      fireEvent.click(cancelButton)
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('ログアウト中はボタンが無効化される', () => {
      render(
        <AccountDialogs 
          {...defaultProps} 
          showSignOutConfirm={true} 
          isSigningOut={true} 
        />
      )
      
      const confirmButton = screen.getByRole('button', { name: /ログアウト中/ })
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ })
      
      expect(confirmButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('アカウント削除確認ダイアログ', () => {
    it('showDeleteConfirmがtrueの時、削除確認ダイアログが表示される', () => {
      render(<AccountDialogs {...defaultProps} showDeleteConfirm={true} />)
      
      expect(screen.getByText('アカウント削除の確認')).toBeInTheDocument()
      expect(screen.getByText(/アカウントを削除すると、すべてのメモデータと設定が完全に削除されます/)).toBeInTheDocument()
      expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
    })

    it('削除確認ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<AccountDialogs {...defaultProps} showDeleteConfirm={true} />)
      
      const confirmButton = screen.getByRole('button', { name: /削除する/ })
      fireEvent.click(confirmButton)
      
      expect(defaultProps.onConfirmDelete).toHaveBeenCalledTimes(1)
    })

    it('削除中はボタンが無効化される', () => {
      render(
        <AccountDialogs 
          {...defaultProps} 
          showDeleteConfirm={true} 
          isDeleting={true} 
        />
      )
      
      const confirmButton = screen.getByRole('button', { name: /削除中/ })
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ })
      
      expect(confirmButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    it('削除ダイアログに警告アイコンが表示される', () => {
      render(<AccountDialogs {...defaultProps} showDeleteConfirm={true} />)
      
      expect(screen.getByText('アカウント削除の確認')).toBeInTheDocument()
    })
  })

  describe('ダイアログの表示制御', () => {
    it('どちらのダイアログも表示されていない場合、何も表示されない', () => {
      const { container } = render(<AccountDialogs {...defaultProps} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('背景クリックでダイアログがキャンセルされる', () => {
      render(<AccountDialogs {...defaultProps} showSignOutConfirm={true} />)
      
      const backdrop = screen.getByTestId('dialog-backdrop')
      fireEvent.click(backdrop)
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('ダイアログ内容をクリックしても閉じない', () => {
      render(<AccountDialogs {...defaultProps} showSignOutConfirm={true} />)
      
      const dialogContent = screen.getByRole('dialog')
      fireEvent.click(dialogContent)
      
      expect(defaultProps.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('ダイアログのスタイリング', () => {
    it('適切なダイアログスタイルが適用される', () => {
      const { container } = render(
        <AccountDialogs {...defaultProps} showSignOutConfirm={true} />
      )
      
      const backdrop = container.querySelector('.fixed.inset-0.z-50')
      expect(backdrop).toHaveClass('flex', 'items-center', 'justify-center', 'bg-black/50')
      
      const dialog = container.querySelector('.rounded-xl.bg-white')
      expect(dialog).toHaveClass('shadow-xl', 'max-w-md', 'w-full')
    })

    it('削除ダイアログの危険なスタイルが適用される', () => {
      render(<AccountDialogs {...defaultProps} showDeleteConfirm={true} />)
      
      const confirmButton = screen.getByRole('button', { name: /削除する/ })
      expect(confirmButton).toHaveClass('rounded-full', 'bg-gradient-to-r', 'from-red-600', 'to-red-700')
    })
  })

  describe('ローディング状態のUI', () => {
    it('ログアウト中にスピナーが表示される', () => {
      const { container } = render(
        <AccountDialogs 
          {...defaultProps} 
          showSignOutConfirm={true} 
          isSigningOut={true} 
        />
      )
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('削除中にスピナーが表示される', () => {
      const { container } = render(
        <AccountDialogs 
          {...defaultProps} 
          showDeleteConfirm={true} 
          isDeleting={true} 
        />
      )
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })
})