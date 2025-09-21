/**
 * useLocale フックのテスト
 * 
 * このテストファイルでは、言語設定フックの動作を検証します。
 * Promiseパラメータのテスト方法やブラウザAPI（document.cookie、navigator.language）の
 * モック手法を学ぶことができます。
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useLocale } from '@/hooks/useLocale'

// navigator.languageのモック
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    language: 'ja-JP'
  }
})

// document.cookieのモック用ヘルパー
const mockDocumentCookie = (cookieString: string) => {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: cookieString
  })
}

describe('useLocale', () => {
  // 各テスト後にクリーンアップ
  afterEach(() => {
    // cookieをリセット
    mockDocumentCookie('')
    // navigator.languageをリセット
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        language: 'ja-JP'
      }
    })
  })

  describe('パラメータからの言語取得', () => {
    it('有効な言語コードが渡された場合、その言語を返す', async () => {
      const params = Promise.resolve({ locale: 'en' })
      const { result } = renderHook(() => useLocale(params))

      // 初期値は'ja'
      expect(result.current).toBe('ja')

      // Promiseが解決されるまで待機
      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('無効な言語コードが渡された場合、デフォルト（ja）を返す', async () => {
      const params = Promise.resolve({ locale: 'invalid' })
      const { result } = renderHook(() => useLocale(params))

      // 初期値と変わらずjaのまま
      expect(result.current).toBe('ja')
      
      await waitFor(() => {
        expect(result.current).toBe('ja')
      })
    })

    it('中国語（zh）が渡された場合、正しく設定される', async () => {
      const params = Promise.resolve({ locale: 'zh' })
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('zh')
      })
    })

    it('サポートされている全ての言語コードが正しく処理される', async () => {
      const supportedLocales = ['ja', 'en', 'zh']
      
      for (const locale of supportedLocales) {
        const params = Promise.resolve({ locale })
        const { result } = renderHook(() => useLocale(params))

        await waitFor(() => {
          expect(result.current).toBe(locale)
        })
      }
    })
  })

  describe('Promiseエラー時のフォールバック', () => {
    it('Promiseが失敗した場合、cookieから言語を取得する', async () => {
      mockDocumentCookie('locale=en; path=/')
      const params = Promise.reject(new Error('Parameter error'))
      
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('Promiseが失敗しcookieも無効な場合、ブラウザ言語を使用する', async () => {
      mockDocumentCookie('invalid=value')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'en-US' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('Promiseが失敗し全てのフォールバックが無効な場合、デフォルト（ja）を返す', async () => {
      mockDocumentCookie('invalid=value')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'fr-FR' } // サポートされていない言語
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('ja')
      })
    })
  })

  describe('getDetectedLocale関数（cookieからの言語検出）', () => {
    it('有効なcookieが存在する場合、その言語を返す', async () => {
      mockDocumentCookie('locale=en; path=/; max-age=31536000')
      const params = Promise.reject(new Error('Parameter error'))
      
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('複数のcookieが存在する場合でもlocaleを正しく取得する', async () => {
      mockDocumentCookie('other=value; locale=zh; another=test')
      const params = Promise.reject(new Error('Parameter error'))
      
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('zh')
      })
    })

    it('localeクッキーが無効な値の場合、ブラウザ言語にフォールバック', async () => {
      mockDocumentCookie('locale=invalid; path=/')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'en-GB' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('localeクッキーが存在しない場合、ブラウザ言語を使用', async () => {
      mockDocumentCookie('other=value; another=test')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'zh-CN' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('zh')
      })
    })
  })

  describe('ブラウザ言語検出', () => {
    it('ブラウザ言語が英語の場合、enを返す', async () => {
      mockDocumentCookie('')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'en-US' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('en')
      })
    })

    it('ブラウザ言語が中国語の場合、zhを返す', async () => {
      mockDocumentCookie('')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'zh-TW' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('zh')
      })
    })

    it('ブラウザ言語が日本語の場合、jaを返す', async () => {
      mockDocumentCookie('')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'ja-JP' }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('ja')
      })
    })

    it('サポートされていないブラウザ言語の場合、デフォルト（ja）を返す', async () => {
      mockDocumentCookie('')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'ko-KR' } // サポートされていない
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('ja')
      })
    })

    it('ブラウザ言語が地域コード付きでも正しく言語部分を抽出する', async () => {
      const testCases = [
        { browserLang: 'en-US', expected: 'en' },
        { browserLang: 'en-GB', expected: 'en' },
        { browserLang: 'zh-CN', expected: 'zh' },
        { browserLang: 'zh-TW', expected: 'zh' },
        { browserLang: 'ja-JP', expected: 'ja' }
      ]

      for (const { browserLang, expected } of testCases) {
        mockDocumentCookie('')
        Object.defineProperty(window, 'navigator', {
          writable: true,
          value: { language: browserLang }
        })
        
        const params = Promise.reject(new Error('Parameter error'))
        const { result } = renderHook(() => useLocale(params))

        await waitFor(() => {
          expect(result.current).toBe(expected)
        })
      }
    })
  })

  describe('優先順位テスト', () => {
    it('パラメータ > cookie > ブラウザ言語の優先順位が正しく動作する', async () => {
      // cookieとブラウザ言語を英語に設定
      mockDocumentCookie('locale=en; path=/')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'en-US' }
      })
      
      // パラメータで中国語を指定（最優先）
      const params = Promise.resolve({ locale: 'zh' })
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('zh') // パラメータが優先される
      })
    })

    it('パラメータが無効な場合、cookie > ブラウザ言語の優先順位が動作する', async () => {
      // cookieを中国語、ブラウザ言語を英語に設定
      mockDocumentCookie('locale=zh; path=/')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: 'en-US' }
      })
      
      // パラメータで無効な言語を指定
      const params = Promise.resolve({ locale: 'invalid' })
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('ja') // 無効なパラメータの場合はデフォルト
      })
    })
  })

  describe('エッジケース', () => {
    it('空文字のパラメータが渡された場合、デフォルトを返す', async () => {
      const params = Promise.resolve({ locale: '' })
      const { result } = renderHook(() => useLocale(params))

      await waitFor(() => {
        expect(result.current).toBe('ja')
      })
    })

    it('undefinedのnavigator.languageでもエラーにならない', async () => {
      mockDocumentCookie('')
      Object.defineProperty(window, 'navigator', {
        writable: true,
        value: { language: undefined }
      })
      
      const params = Promise.reject(new Error('Parameter error'))
      const { result } = renderHook(() => useLocale(params))
      
      await waitFor(() => {
        // undefinedの場合はデフォルトのjaが返される
        expect(result.current).toBe('ja')
      })
    })

    it('paramsが何度も更新される場合でも正しく動作する', async () => {
      let resolveParam: (value: { locale: string }) => void
      let params = new Promise<{ locale: string }>((resolve) => {
        resolveParam = resolve
      })
      
      const { result, rerender } = renderHook(
        ({ params }) => useLocale(params),
        { initialProps: { params } }
      )

      // 初期値
      expect(result.current).toBe('ja')

      // 最初のパラメータを解決
      resolveParam({ locale: 'en' })
      await waitFor(() => {
        expect(result.current).toBe('en')
      })

      // 新しいPromiseで再レンダリング
      let resolveParam2: (value: { locale: string }) => void
      const params2 = new Promise<{ locale: string }>((resolve) => {
        resolveParam2 = resolve
      })
      
      rerender({ params: params2 })
      resolveParam2({ locale: 'zh' })
      await waitFor(() => {
        expect(result.current).toBe('zh')
      })
    })
  })
})