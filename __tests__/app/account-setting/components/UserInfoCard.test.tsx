/**
 * UserInfoCardコンポーネントのテスト
 * ユーザー情報表示カードのテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserInfoCard } from '@/app/(protected)/account-setting/components/UserInfoCard'
import type { UserInfo } from '@/app/(protected)/account-setting/types'

describe('UserInfoCard', () => {
  const mockUser: UserInfo = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com'
  }

  it('ユーザー情報が正しく表示される', () => {
    render(<UserInfoCard user={mockUser} />)
    
    expect(screen.getByText('ユーザー情報')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('ユーザーアイコンとメールアイコンが表示される', () => {
    const { container } = render(<UserInfoCard user={mockUser} />)
    
    const userIcon = container.querySelector('.lucide-user')
    const mailIcon = container.querySelector('.lucide-mail')
    
    expect(userIcon).toBeInTheDocument()
    expect(mailIcon).toBeInTheDocument()
  })

  it('適切なカードスタイリングが適用される', () => {
    const { container } = render(<UserInfoCard user={mockUser} />)
    
    const card = container.firstChild
    expect(card).toHaveClass('overflow-hidden', 'rounded-xl', 'bg-white', 'shadow-md')
  })

  it('ヘッダーのグラデーションが適用される', () => {
    const { container } = render(<UserInfoCard user={mockUser} />)
    
    const header = container.querySelector('.bg-gradient-to-r')
    expect(header).toHaveClass('from-indigo-500', 'to-purple-600')
  })

  it('情報項目が適切に構造化される', () => {
    render(<UserInfoCard user={mockUser} />)
    
    // メールアドレスの項目
    const emailLabel = screen.getByText('メールアドレス')
    expect(emailLabel).toHaveClass('text-sm', 'text-gray-600')
  })

  it('アイコンのサイズとスタイルが適切に設定される', () => {
    const { container } = render(<UserInfoCard user={mockUser} />)
    
    // ヘッダーアイコンは20px
    const headerIcon = container.querySelector('h2 svg')
    expect(headerIcon).toHaveAttribute('width', '20')
    expect(headerIcon).toHaveAttribute('height', '20')
    
    // 情報項目のアイコンは16px（Mail）
    const mailIcon = container.querySelector('svg[class*="lucide-mail"]')
    
    expect(mailIcon).toHaveAttribute('width', '16')
    expect(mailIcon).toHaveAttribute('height', '16')
  })
})