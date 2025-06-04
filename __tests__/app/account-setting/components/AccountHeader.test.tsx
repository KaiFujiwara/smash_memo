/**
 * AccountHeaderコンポーネントのテスト
 * アカウント設定画面のヘッダー部分のテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { AccountHeader } from '@/app/(protected)/account-setting/components/AccountHeader'

describe('AccountHeader', () => {
  it('タイトルが正しく表示される', () => {
    render(<AccountHeader />)
    
    expect(screen.getByText('アカウント設定')).toBeInTheDocument()
  })

  it('設定アイコンが表示される', () => {
    const { container } = render(<AccountHeader />)
    
    // Lucide React のアイコンクラスを確認
    const icon = container.querySelector('.lucide-user-cog')
    expect(icon).toBeInTheDocument()
  })

  it('適切なスタイリングが適用される', () => {
    const { container } = render(<AccountHeader />)
    
    const headerElement = container.firstChild
    expect(headerElement).toHaveClass('mb-6')
    
    const titleElement = screen.getByRole('heading', { level: 1 })
    expect(titleElement).toHaveClass('text-2xl', 'font-bold', 'text-gray-900')
  })

  it('アイコンとタイトルが適切に配置される', () => {
    const { container } = render(<AccountHeader />)
    
    const flexContainer = container.querySelector('.flex.items-center.gap-3')
    expect(flexContainer).toBeInTheDocument()
  })

  it('アイコンのサイズとカラーが適切に設定される', () => {
    const { container } = render(<AccountHeader />)
    
    const icon = container.querySelector('svg')
    expect(icon).toHaveAttribute('width', '24')
    expect(icon).toHaveAttribute('height', '24')
    expect(icon).toHaveClass('text-indigo-600')
  })
})