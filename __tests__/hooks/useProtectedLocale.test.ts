import { renderHook } from '@testing-library/react'
import { useProtectedLocale } from '@/hooks/useProtectedLocale'

// Cookieのモック
const mockDocumentCookie = (cookieString: string) => {
  Object.defineProperty(document, 'cookie', {
    value: cookieString,
    configurable: true,
  })
}

// navigator.languageのモック
const mockNavigatorLanguage = (language: string) => {
  Object.defineProperty(navigator, 'language', {
    value: language,
    configurable: true,
  })
}

describe('useProtectedLocale', () => {
  beforeEach(() => {
    // 各テスト前にCookieとnavigator.languageをリセット
    mockDocumentCookie('')
    mockNavigatorLanguage('ja')
  })

  describe('Cookie優先の言語検出', () => {
    it('Cookieに日本語が設定されている場合、jaを返す', () => {
      mockDocumentCookie('locale=ja; other=value')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('ja')
    })

    it('Cookieに英語が設定されている場合、enを返す', () => {
      mockDocumentCookie('locale=en; other=value')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('en')
    })

    it('Cookieに中国語が設定されている場合、zhを返す', () => {
      mockDocumentCookie('locale=zh; other=value')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('zh')
    })

    it('Cookieにサポートされていない言語が設定されている場合、ブラウザ言語にフォールバック', () => {
      mockDocumentCookie('locale=fr; other=value')
      mockNavigatorLanguage('en-US')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('en')
    })
  })

  describe('ブラウザ言語の検出', () => {
    it('Cookieがない場合、ブラウザ言語が英語なら en を返す', () => {
      mockDocumentCookie('')
      mockNavigatorLanguage('en-US')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('en')
    })

    it('Cookieがない場合、ブラウザ言語が中国語なら zh を返す', () => {
      mockDocumentCookie('')
      mockNavigatorLanguage('zh-CN')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('zh')
    })

    it('Cookieがない場合、ブラウザ言語が日本語なら ja を返す', () => {
      mockDocumentCookie('')
      mockNavigatorLanguage('ja-JP')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('ja')
    })

    it('ブラウザ言語がサポートされていない場合、デフォルトの ja を返す', () => {
      mockDocumentCookie('')
      mockNavigatorLanguage('fr-FR')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('ja')
    })
  })

  describe('エッジケース', () => {
    it('Cookieが空の場合、ブラウザ言語にフォールバック', () => {
      mockDocumentCookie('')
      mockNavigatorLanguage('en-GB')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('en')
    })

    it('Cookieの形式が不正な場合、ブラウザ言語にフォールバック', () => {
      mockDocumentCookie('invalid=cookie; format')
      mockNavigatorLanguage('zh')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('zh')
    })

    it('navigator.languageが undefined の場合、デフォルトの ja を返す', () => {
      mockDocumentCookie('')
      Object.defineProperty(navigator, 'language', {
        value: undefined,
        configurable: true,
      })
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('ja')
    })

    it('複数のCookieがある場合、正しいlocaleを見つける', () => {
      mockDocumentCookie('first=value1; locale=en; last=value2')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('en')
    })
  })

  describe('優先順位の確認', () => {
    it('Cookieとブラウザ言語が異なる場合、Cookieが優先される', () => {
      mockDocumentCookie('locale=ja')
      mockNavigatorLanguage('en-US')
      
      const { result } = renderHook(() => useProtectedLocale())
      
      expect(result.current).toBe('ja')
    })
  })
})