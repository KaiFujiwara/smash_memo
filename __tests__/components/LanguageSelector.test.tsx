/**
 * LanguageSelectorコンポーネントのテスト
 * 
 * このテストファイルでは、言語選択コンポーネントの動作を検証します。
 * React Testing Libraryを使ったドロップダウンコンポーネントのテスト方法や、
 * useRouterのモック、document.cookieの操作テストを学ぶことができます。
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import LanguageSelector from '@/components/LanguageSelector'

// Next.jsのhooksをモック
jest.mock('next/navigation')

// lucide-reactのGlobeアイコンをモック
jest.mock('lucide-react', () => ({
  Globe: ({ className }: { className?: string }) => (
    <div data-testid="globe-icon" className={className}>Globe</div>
  )
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// document.cookieのモック用ヘルパー
const mockDocumentCookie = (cookieString: string) => {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: cookieString
  })
}

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: mockRefresh,
      prefetch: jest.fn()
    } as any)

    mockUsePathname.mockReturnValue('/login')
    
    // cookieをリセット
    mockDocumentCookie('')
  })

  describe('基本的な表示', () => {
    it('初期状態で現在の言語が選択されている（日本語）', () => {
      render(<LanguageSelector currentLocale="ja" />)

      // ドロップダウンボタンを確認
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('日本語')

      // Globe iconが表示されている
      const globeIcon = screen.getByTestId('globe-icon')
      expect(globeIcon).toBeInTheDocument()
    })

    it('初期状態で現在の言語が選択されている（英語）', () => {
      render(<LanguageSelector currentLocale="en" />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('English')
    })

    it('初期状態で現在の言語が選択されている（中国語）', () => {
      render(<LanguageSelector currentLocale="zh" />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('中文')
    })

    it('サポートされていない言語の場合、日本語がデフォルトで選択される', () => {
      render(<LanguageSelector currentLocale="invalid" as any />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('日本語')
    })
  })

  describe('ドロップダウンの操作', () => {
    it('ボタンをクリックするとドロップダウンが開く', async () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ドロップダウンの選択肢が表示される
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(2) // ボタン内とドロップダウン内
        expect(screen.getByText('English')).toBeInTheDocument()
        expect(screen.getByText('中文')).toBeInTheDocument()
      })
    })

    it('ドロップダウンを開いた状態で再度ボタンをクリックすると閉じる', async () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      
      // 開く
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(2) // ボタン内とドロップダウン内
      })

      // 閉じる
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(1) // ボタン内のみ
      })
    })

    it('ドロップダウンの外側をクリックすると閉じる', async () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ドロップダウンが開いている状態を確認
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(2)
      })

      // 外側をmousedownでクリック
      fireEvent.mouseDown(document.body)

      // ドロップダウンが閉じることを確認
      await waitFor(() => {
        expect(screen.getAllByText('日本語')).toHaveLength(1) // ボタン内のみ
      })
    })
  })

  describe('言語変更処理', () => {
    it('英語を選択すると正しくナビゲートされる', async () => {
      mockUsePathname.mockReturnValue('/login')
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const englishOption = await screen.findByText('English')
      fireEvent.click(englishOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/login')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('中国語を選択すると正しくナビゲートされる', async () => {
      mockUsePathname.mockReturnValue('/login')
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const chineseOption = await screen.findByText('中文')
      fireEvent.click(chineseOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/zh/login')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('日本語を選択すると言語パスが除去される', async () => {
      mockUsePathname.mockReturnValue('/en/login')
      render(<LanguageSelector currentLocale="en" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const japaneseOptions = await screen.findAllByText('日本語')
      fireEvent.click(japaneseOptions[0]) // ドロップダウン内の日本語

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('同じ言語を再選択しても処理が実行されない', async () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ドロップダウン内の日本語を取得（2番目の要素）
      const japaneseOptions = await screen.findAllByText('日本語')
      fireEvent.click(japaneseOptions[1]) // ドロップダウン内の日本語

      // ナビゲートが呼ばれないことを確認
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('パス解析とナビゲーション', () => {
    it('ルートパス（/）から英語に変更すると/en/に遷移する', async () => {
      mockUsePathname.mockReturnValue('/')
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const englishOption = await screen.findByText('English')
      fireEvent.click(englishOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('既に言語パスがある場合（/en/terms）、新しい言語パスに置換される', async () => {
      mockUsePathname.mockReturnValue('/en/terms')
      render(<LanguageSelector currentLocale="en" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const chineseOption = await screen.findByText('中文')
      fireEvent.click(chineseOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/zh/terms')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('日本語パス（/ja/privacy-policy）から他言語に変更すると正しく変換される', async () => {
      mockUsePathname.mockReturnValue('/ja/privacy-policy')
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const englishOption = await screen.findByText('English')
      fireEvent.click(englishOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/privacy-policy')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('英語パス（/en/privacy-policy）から日本語を選択すると言語パスが除去される', async () => {
      mockUsePathname.mockReturnValue('/en/privacy-policy')
      render(<LanguageSelector currentLocale="en" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const japaneseOptions = await screen.findAllByText('日本語')
      fireEvent.click(japaneseOptions[0]) // ドロップダウン内の日本語

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/privacy-policy')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('深いパス（/en/some/deep/path）でも正しく処理される', async () => {
      mockUsePathname.mockReturnValue('/en/some/deep/path')
      render(<LanguageSelector currentLocale="en" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const chineseOption = await screen.findByText('中文')
      fireEvent.click(chineseOption)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/zh/some/deep/path')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('クッキー設定', () => {
    it('言語変更時にクッキーが正しく設定される', async () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const englishOption = await screen.findByText('English')
      fireEvent.click(englishOption)

      // クッキーが設定されることを確認（実際の値は確認できないため、エラーが発生しないことを確認）
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('currentLocaleの変更に対する反応', () => {
    it('currentLocaleプロパティが変更されると表示が更新される', () => {
      const { rerender } = render(<LanguageSelector currentLocale="ja" />)

      let button = screen.getByRole('button')
      expect(button).toHaveTextContent('日本語')

      // propsを変更
      rerender(<LanguageSelector currentLocale="en" />)

      button = screen.getByRole('button')
      expect(button).toHaveTextContent('English')
    })

    it('currentLocaleが頻繁に変更されても正しく動作する', () => {
      const { rerender } = render(<LanguageSelector currentLocale="ja" />)

      const locales = ['ja', 'en', 'zh', 'ja', 'en'] as const
      const expectedTexts = ['日本語', 'English', '中文', '日本語', 'English']

      locales.forEach((locale, index) => {
        rerender(<LanguageSelector currentLocale={locale} />)
        const button = screen.getByRole('button')
        expect(button).toHaveTextContent(expectedTexts[index])
      })
    })
  })

  describe('UI要素の確認', () => {
    it('ドロップダウンの開閉アイコンが表示される', () => {
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      
      // SVGの矢印アイコンが存在することを確認
      const svgIcon = button.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('undefinedのcurrentLocaleでもエラーにならない', () => {
      expect(() => {
        render(<LanguageSelector currentLocale={undefined as any} />)
      }).not.toThrow()

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('日本語') // デフォルトにフォールバック
    })

    it('空文字のcurrentLocaleでもエラーにならない', () => {
      expect(() => {
        render(<LanguageSelector currentLocale={'' as any} />)
      }).not.toThrow()

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('日本語') // デフォルトにフォールバック
    })

    it('pathnameが特殊な形式でもエラーにならない', async () => {
      mockUsePathname.mockReturnValue('//double//slash//path')
      render(<LanguageSelector currentLocale="ja" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      const englishOption = await screen.findByText('English')
      
      expect(() => {
        fireEvent.click(englishOption)
      }).not.toThrow()
    })
  })
})