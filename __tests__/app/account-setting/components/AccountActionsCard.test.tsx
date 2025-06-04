/**
 * AccountActionsCardコンポーネントのテスト
 * アカウント操作カードのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccountActionsCard } from '@/app/(protected)/account-setting/components/AccountActionsCard'

describe('AccountActionsCard', () => {
  const defaultProps = {
    isSigningOut: false,
    isDeleting: false,
    onSignOut: jest.fn(),
    onDeleteAccount: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('アカウント操作の項目が表示される', () => {
    render(<AccountActionsCard {...defaultProps} />)
    
    expect(screen.getByText('アカウント操作')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ログアウト' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'アカウント削除' })).toBeInTheDocument()
  })

  it('ログアウトボタンをクリックするとコールバックが呼ばれる', () => {
    render(<AccountActionsCard {...defaultProps} />)
    
    const signOutButton = screen.getByRole('button', { name: /ログアウト/ })
    fireEvent.click(signOutButton)
    
    expect(defaultProps.onSignOut).toHaveBeenCalledTimes(1)
  })

  it('アカウント削除ボタンをクリックするとコールバックが呼ばれる', () => {
    render(<AccountActionsCard {...defaultProps} />)
    
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    fireEvent.click(deleteButton)
    
    expect(defaultProps.onDeleteAccount).toHaveBeenCalledTimes(1)
  })

  it('ログアウト中はボタンが無効化され、ローディング表示される', () => {
    render(<AccountActionsCard {...defaultProps} isSigningOut={true} />)
    
    const signOutButton = screen.getByRole('button', { name: /ログアウト中/ })
    expect(signOutButton).toBeDisabled()
    expect(screen.getByText('ログアウト中...')).toBeInTheDocument()
  })

  it('削除中はボタンが無効化され、ローディング表示される', () => {
    render(<AccountActionsCard {...defaultProps} isDeleting={true} />)
    
    const deleteButton = screen.getByRole('button', { name: /削除中/ })
    expect(deleteButton).toBeDisabled()
    expect(screen.getByText('削除中...')).toBeInTheDocument()
  })

  it('適切なアイコンが表示される', () => {
    const { container } = render(<AccountActionsCard {...defaultProps} />)
    
    const logOutIcon = container.querySelector('svg[class*="lucide-log-out"]')
    const trashIcon = container.querySelector('svg[class*="lucide-trash"]')
    const settingsIcon = container.querySelector('svg[class*="lucide-settings"]')
    
    expect(logOutIcon).toBeInTheDocument()
    expect(trashIcon).toBeInTheDocument()
    expect(settingsIcon).toBeInTheDocument()
  })

  it('ボタンの説明テキストが表示される', () => {
    render(<AccountActionsCard {...defaultProps} />)
    
    expect(screen.getByText('アプリからログアウトします')).toBeInTheDocument()
    expect(screen.getByText('アカウントとすべてのデータを完全に削除します')).toBeInTheDocument()
  })

  it('適切なボタンスタイルが適用される', () => {
    render(<AccountActionsCard {...defaultProps} />)
    
    const signOutButton = screen.getByRole('button', { name: /ログアウト/ })
    const deleteButton = screen.getByRole('button', { name: /アカウントを削除/ })
    
    expect(signOutButton).toHaveClass('rounded-full', 'bg-gradient-to-r', 'from-gray-600', 'to-gray-700')
    expect(deleteButton).toHaveClass('rounded-full', 'bg-gradient-to-r', 'from-red-600', 'to-red-700')
  })

  it('ローディング中のスピナーが表示される', () => {
    const { container } = render(
      <AccountActionsCard {...defaultProps} isSigningOut={true} />
    )
    
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('カードのスタイリングが適切に適用される', () => {
    const { container } = render(<AccountActionsCard {...defaultProps} />)
    
    const card = container.firstChild
    expect(card).toHaveClass('overflow-hidden', 'rounded-xl', 'bg-white', 'shadow-md')
  })

  it('両方のボタンが同時にローディング状態になることができる', () => {
    render(
      <AccountActionsCard 
        {...defaultProps} 
        isSigningOut={true} 
        isDeleting={true} 
      />
    )
    
    const signOutButton = screen.getByRole('button', { name: /ログアウト中/ })
    const deleteButton = screen.getByRole('button', { name: /削除中/ })
    
    expect(signOutButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
  })
})