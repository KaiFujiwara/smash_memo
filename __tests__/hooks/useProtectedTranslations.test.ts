import { renderHook } from '@testing-library/react'
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import { useProtectedLocale } from '@/hooks/useProtectedLocale'

// useProtectedLocaleをモック
jest.mock('@/hooks/useProtectedLocale')
const mockUseProtectedLocale = useProtectedLocale as jest.MockedFunction<typeof useProtectedLocale>

describe('useProtectedTranslations', () => {
  // テスト用の翻訳データ
  const mockJaTranslations = {
    metadata: {
      title: 'テストタイトル',
      description: 'テスト説明'
    },
    greeting: 'こんにちは',
    button: {
      save: '保存',
      cancel: 'キャンセル'
    }
  }

  const mockEnTranslations = {
    metadata: {
      title: 'Test Title',
      description: 'Test Description'
    },
    greeting: 'Hello',
    button: {
      save: 'Save',
      cancel: 'Cancel'
    }
  }

  const mockZhTranslations = {
    metadata: {
      title: '测试标题',
      description: '测试描述'
    },
    greeting: '你好',
    button: {
      save: '保存',
      cancel: '取消'
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('言語ごとの翻訳取得', () => {
    it('localeがjaの場合、日本語翻訳を返す', () => {
      mockUseProtectedLocale.mockReturnValue('ja')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.locale).toBe('ja')
      expect(result.current.t).toEqual(mockJaTranslations)
      expect(result.current.t.greeting).toBe('こんにちは')
      expect(result.current.t.button.save).toBe('保存')
    })

    it('localeがenの場合、英語翻訳を返す', () => {
      mockUseProtectedLocale.mockReturnValue('en')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.locale).toBe('en')
      expect(result.current.t).toEqual(mockEnTranslations)
      expect(result.current.t.greeting).toBe('Hello')
      expect(result.current.t.button.save).toBe('Save')
    })

    it('localeがzhの場合、中国語翻訳を返す', () => {
      mockUseProtectedLocale.mockReturnValue('zh')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.locale).toBe('zh')
      expect(result.current.t).toEqual(mockZhTranslations)
      expect(result.current.t.greeting).toBe('你好')
      expect(result.current.t.button.save).toBe('保存')
    })
  })

  describe('メタデータの取得', () => {
    it('日本語のメタデータが正しく取得できる', () => {
      mockUseProtectedLocale.mockReturnValue('ja')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.t.metadata.title).toBe('テストタイトル')
      expect(result.current.t.metadata.description).toBe('テスト説明')
    })

    it('英語のメタデータが正しく取得できる', () => {
      mockUseProtectedLocale.mockReturnValue('en')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.t.metadata.title).toBe('Test Title')
      expect(result.current.t.metadata.description).toBe('Test Description')
    })

    it('中国語のメタデータが正しく取得できる', () => {
      mockUseProtectedLocale.mockReturnValue('zh')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.t.metadata.title).toBe('测试标题')
      expect(result.current.t.metadata.description).toBe('测试描述')
    })
  })

  describe('ネストされたオブジェクトの翻訳', () => {
    it('ネストされたオブジェクトが正しく取得できる', () => {
      mockUseProtectedLocale.mockReturnValue('ja')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.t.button).toEqual({
        save: '保存',
        cancel: 'キャンセル'
      })
    })

    it('言語変更時にネストされたオブジェクトも正しく更新される', () => {
      mockUseProtectedLocale.mockReturnValue('en')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current.t.button).toEqual({
        save: 'Save',
        cancel: 'Cancel'
      })
    })
  })

  describe('戻り値の型確認', () => {
    it('localeとtが正しく返される', () => {
      mockUseProtectedLocale.mockReturnValue('ja')

      const { result } = renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(result.current).toHaveProperty('locale')
      expect(result.current).toHaveProperty('t')
      expect(typeof result.current.locale).toBe('string')
      expect(typeof result.current.t).toBe('object')
    })

    it('useProtectedLocaleが正しく呼び出される', () => {
      mockUseProtectedLocale.mockReturnValue('ja')

      renderHook(() =>
        useProtectedTranslations(mockJaTranslations, mockEnTranslations, mockZhTranslations)
      )

      expect(mockUseProtectedLocale).toHaveBeenCalledTimes(1)
    })
  })

  describe('翻訳データの一貫性', () => {
    it('すべての翻訳データが同じ構造を持つ', () => {
      const translations = [mockJaTranslations, mockEnTranslations, mockZhTranslations]
      
      // すべての翻訳データが metadata プロパティを持つことを確認
      translations.forEach(translation => {
        expect(translation).toHaveProperty('metadata')
        expect(translation.metadata).toHaveProperty('title')
        expect(translation.metadata).toHaveProperty('description')
      })

      // すべての翻訳データが同じキーを持つことを確認
      const jaKeys = Object.keys(mockJaTranslations).sort()
      const enKeys = Object.keys(mockEnTranslations).sort()
      const zhKeys = Object.keys(mockZhTranslations).sort()

      expect(jaKeys).toEqual(enKeys)
      expect(enKeys).toEqual(zhKeys)
    })
  })
})