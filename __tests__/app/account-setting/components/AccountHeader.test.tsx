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

})