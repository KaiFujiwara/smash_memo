import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProtectedLanguageSelector from '@/app/(protected)/components/ProtectedLanguageSelector'

// document.cookieのモック
const mockDocumentCookie = (cookieString: string) => {
  Object.defineProperty(document, 'cookie', {
    value: cookieString,
    configurable: true,
  })
}

describe('ProtectedLanguageSelector', () => {
  beforeEach(() => {
    mockDocumentCookie('')
  })

  describe('デスクトップ版（デフォルト）', () => {
    it('現在の言語が正しく表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      expect(screen.getByText('日本語')).toBeInTheDocument()
      expect(screen.getByLabelText('言語選択')).toBeInTheDocument()
    })

    it('英語が選択されている場合、Englishが表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="en" />)
      
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('中国語が選択されている場合、中文が表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="zh" />)
      
      expect(screen.getByText('中文')).toBeInTheDocument()
    })

    it('ボタンをクリックするとドロップダウンが開く', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      expect(screen.getAllByText('日本語')).toHaveLength(2) // ボタン + ドロップダウン
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('中文')).toBeInTheDocument()
    })

    it('現在選択されている言語が強調表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="en" />)
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      const options = screen.getAllByRole('button')
      const englishOption = options.find(option => option.textContent === 'English' && option.classList.contains('bg-blue-50'))
      
      expect(englishOption).toBeInTheDocument()
    })
  })

  describe('モバイル版', () => {
    it('モバイル版では幅広のボタンが表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" variant="mobile" />)
      
      const button = screen.getByLabelText('言語選択')
      expect(button).toHaveClass('flex', 'w-full', 'items-center', 'justify-between')
      expect(screen.getByText('日本語')).toBeInTheDocument()
    })

    it('モバイル版でドロップダウンを開くと背景が半透明になる', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" variant="mobile" />)
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      const dropdown = button.closest('div')?.querySelector('.bg-white\\/10')
      expect(dropdown).toBeInTheDocument()
    })

    it('モバイル版では現在選択されている言語の背景が変わる', () => {
      render(<ProtectedLanguageSelector currentLocale="en" variant="mobile" />)
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      const options = screen.getAllByRole('button')
      const englishOption = options.find(option => 
        option.textContent === 'English' && 
        option.classList.contains('bg-white/20')
      )
      
      expect(englishOption).toBeInTheDocument()
    })
  })

  describe('ドロップダウンの開閉', () => {
    it('初期状態ではドロップダウンが閉じている', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      // ドロップダウンのオプションが表示されていないことを確認
      expect(screen.getAllByText('日本語')).toHaveLength(1) // ボタンのテキストのみ
    })

    it('ボタンクリック後にもう一度クリックするとドロップダウンが閉じる', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      const button = screen.getByLabelText('言語選択')
      
      // 開く
      fireEvent.click(button)
      expect(screen.getAllByText('日本語')).toHaveLength(2) // ボタン + ドロップダウン
      
      // 閉じる
      fireEvent.click(button)
      expect(screen.getAllByText('日本語')).toHaveLength(1) // ボタンのみ
    })

    it('外側をクリックするとドロップダウンが閉じる', async () => {
      render(
        <div>
          <ProtectedLanguageSelector currentLocale="ja" />
          <div data-testid="outside">Outside</div>
        </div>
      )
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      // ドロップダウンが開いていることを確認
      expect(screen.getAllByText('日本語')).toHaveLength(2)
      
      // 外側をクリック
      const outside = screen.getByTestId('outside')
      fireEvent.mouseDown(outside)
      
      // ドロップダウンが閉じることを確認
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(1)
      })
    })
  })

  describe('シェブロンアイコンの回転', () => {
    it('ドロップダウンが開いている時、シェブロンが回転する', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      const button = screen.getByLabelText('言語選択')
      
      // 初期状態（閉じている）
      const chevron = button.querySelector('svg.lucide-chevron-down')
      expect(chevron).not.toHaveClass('rotate-180')
      
      // 開く
      fireEvent.click(button)
      expect(chevron).toHaveClass('rotate-180')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なaria-labelが設定されている', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      expect(screen.getByLabelText('言語選択')).toBeInTheDocument()
    })

    it('キーボードナビゲーションのためのボタンが正しく設定されている', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      const button = screen.getByLabelText('言語選択')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('エラーハンドリング', () => {
    it('不正なcurrentLocaleが渡されてもエラーにならない', () => {
      // TypeScriptでは型チェックされるが、実行時の安全性をテスト
      render(<ProtectedLanguageSelector currentLocale={'invalid' as any} />)
      
      // デフォルトで日本語が表示される
      expect(screen.getByText('日本語')).toBeInTheDocument()
    })
  })

  describe('言語選択の基本動作', () => {
    it('言語オプションが正しく表示される', () => {
      render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      const button = screen.getByLabelText('言語選択')
      fireEvent.click(button)
      
      // 全ての言語オプションが表示されることを確認
      expect(screen.getAllByText('日本語')).toHaveLength(2) // ボタン + ドロップダウン
      expect(screen.getByText('English')).toBeInTheDocument() 
      expect(screen.getByText('中文')).toBeInTheDocument()
    })

    it('デスクトップ版とモバイル版で異なるスタイルが適用される', () => {
      const { rerender } = render(<ProtectedLanguageSelector currentLocale="ja" />)
      
      // デスクトップ版
      let button = screen.getByLabelText('言語選択')
      expect(button).toHaveClass('rounded-full', 'bg-white/10')
      
      // モバイル版
      rerender(<ProtectedLanguageSelector currentLocale="ja" variant="mobile" />)
      button = screen.getByLabelText('言語選択')
      expect(button).toHaveClass('w-full', 'rounded-lg')
    })
  })
})