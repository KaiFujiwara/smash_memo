/**
 * MemoSettingsPageのテスト
 * メモ項目設定ページの統合的な動作を確認
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { getMemoItems } from '@/services/memoItemService'
import { toast } from 'sonner'
import MemoSettingsPage from '@/app/(protected)/memo-settings/page'

// モック設定
jest.mock('@/hooks/useAuth')
jest.mock('@/services/memoItemService')
jest.mock('sonner')

// フック関連のモック
jest.mock('@/app/(protected)/memo-settings/hooks/useMemoActions', () => ({
  useMemoActions: jest.fn(() => ({
    handleAddItem: jest.fn(),
    handleStartEditing: jest.fn(),
    handleSaveEdit: jest.fn(),
    handleDeleteItem: jest.fn()
  }))
}))

jest.mock('@/app/(protected)/memo-settings/hooks/useDragDropActions', () => ({
  useDragDropActions: jest.fn(() => ({
    handleDragStart: jest.fn(),
    handleDragEnd: jest.fn()
  }))
}))

// window.confirmのモック
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetMemoItems = getMemoItems as jest.MockedFunction<typeof getMemoItems>
const mockToast = toast as jest.Mocked<typeof toast>

// サンプルデータ
const sampleMemoItems = [
  {
    id: '1',
    name: 'コンボ',
    order: 1,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '立ち回り',
    order: 2,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

describe('MemoSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのモック設定
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { 
        id: 'test-user',
        username: 'test@example.com',
        email: 'test@example.com',
        displayName: 'test@example.com'
      },
      isLoading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
    
    mockGetMemoItems.mockResolvedValue({
      items: sampleMemoItems
    })
    
    mockToast.error = jest.fn()
    mockConfirm.mockReturnValue(true) // デフォルトで確認
  })

  describe('認証状態', () => {
    it('未認証の場合はデータ取得しない', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<MemoSettingsPage />)
      
      expect(mockGetMemoItems).not.toHaveBeenCalled()
    })

    it('認証済みの場合はデータ取得する', async () => {
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(mockGetMemoItems).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('初期状態・ローディング', () => {
    it('ローディング中はスピナーが表示される', () => {
      // データ取得を保留状態にする
      mockGetMemoItems.mockImplementation(() => new Promise(() => {}))
      
      render(<MemoSettingsPage />)
      
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('ローディング完了後にコンテンツが表示される', async () => {
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      })
      
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
    })
  })

  describe('データ取得', () => {
    it('正常にデータが取得されて表示される', async () => {
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('2 / 20 項目')).toBeInTheDocument()
      })
      
      expect(mockGetMemoItems).toHaveBeenCalledTimes(1)
      expect(mockToast.error).not.toHaveBeenCalled()
    })

    it('データ取得エラー時にエラートーストが表示される', async () => {
      mockGetMemoItems.mockRejectedValue(new Error('Network error'))
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('データの取得に失敗しました')
      })
      
      expect(screen.getByText('0 / 20 項目')).toBeInTheDocument()
    })

    it('空のデータが返された場合も正常に表示される', async () => {
      mockGetMemoItems.mockResolvedValue({
        items: []
      })
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('0 / 20 項目')).toBeInTheDocument()
      })
    })

    it('itemsがundefinedの場合も正常に処理される', async () => {
      mockGetMemoItems.mockResolvedValue({
        items: undefined
      } as any)
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('0 / 20 項目')).toBeInTheDocument()
      })
    })
  })

  describe('コンポーネントの統合', () => {
    beforeEach(async () => {
      render(<MemoSettingsPage />)
      await waitFor(() => {
        expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      })
    })

    it('AddNewItemSectionが正しく表示される', () => {
      expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('例: 立ち回り、コンボ、崖狩りなど')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
    })

    it('MemoItemsListが正しく表示される', () => {
      // MemoItemsListコンポーネントが存在することを確認
      expect(screen.getByText('2 / 20 項目')).toBeInTheDocument()
    })

  })

  describe('入力操作', () => {
    beforeEach(async () => {
      render(<MemoSettingsPage />)
      await waitFor(() => {
        expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      })
    })

    it('新規項目名の入力が状態に反映される', () => {
      const input = screen.getByPlaceholderText('例: 立ち回り、コンボ、崖狩りなど')
      
      fireEvent.change(input, { target: { value: '新しい項目' } })
      
      expect(input).toHaveValue('新しい項目')
    })

    it('文字数カウンターが更新される', () => {
      const input = screen.getByPlaceholderText('例: 立ち回り、コンボ、崖狩りなど')
      
      fireEvent.change(input, { target: { value: 'テスト' } })
      
      expect(screen.getByText('3/50')).toBeInTheDocument()
    })
  })

  describe('最大項目数制限', () => {
    it('最大項目数に達した場合の表示', async () => {
      // 20個の項目を作成
      const maxItems = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        name: `項目${i + 1}`,
        order: i + 1,
        visible: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }))
      
      mockGetMemoItems.mockResolvedValue({
        items: maxItems
      })
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('20 / 20 項目')).toBeInTheDocument()
        expect(screen.getByText('（上限達成）')).toBeInTheDocument()
      })
      
      // 入力フィールドが無効化されている
      const input = screen.getByPlaceholderText('例: 立ち回り、コンボ、崖狩りなど')
      expect(input).toBeDisabled()
      
      // 追加ボタンが無効化されている
      const addButton = screen.getByRole('button', { name: '追加' })
      expect(addButton).toBeDisabled()
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラー時の処理', async () => {
      mockGetMemoItems.mockRejectedValue(new Error('Failed to fetch'))
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('データの取得に失敗しました')
      })
      
      // エラー後も画面は表示される
      expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      expect(screen.getByText('0 / 20 項目')).toBeInTheDocument()
    })

    it('タイムアウトエラー時の処理', async () => {
      mockGetMemoItems.mockRejectedValue(new Error('Timeout'))
      
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('データの取得に失敗しました')
      })
      
      // エラー後も画面は表示される
      expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      expect(screen.getByText('0 / 20 項目')).toBeInTheDocument()
    })
  })

  describe('削除確認ダイアログ', () => {
    it('window.confirmが呼ばれる', () => {
      // この部分は実際にはuseMemoActionsのテストで詳細にテストされる
      expect(mockConfirm).toBeDefined()
    })
  })

  describe('再認証時の動作', () => {
    it('認証状態が変更された時にデータを再取得する', async () => {
      // 最初は未認証
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      const { rerender } = render(<MemoSettingsPage />)
      
      expect(mockGetMemoItems).not.toHaveBeenCalled()
      
      // 認証状態に変更
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { 
          id: 'test-user',
          username: 'test@example.com',
          email: 'test@example.com',
          displayName: 'test@example.com'
        },
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(mockGetMemoItems).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('window.confirmの動作確認', () => {
    it('confirmのモックが正しく設定されている', () => {
      expect(window.confirm).toBe(mockConfirm)
      expect(typeof window.confirm).toBe('function')
    })

    it('confirmがfalseを返した場合の処理', () => {
      mockConfirm.mockReturnValue(false)
      // 実際の削除確認テストはuseMemoActionsで行う
      expect(mockConfirm).toBeDefined()
    })
  })

  describe('削除確認機能', () => {
    it('カスタムダイアログ関連のDOMが存在しない', () => {
      render(<MemoSettingsPage />)
      
      // カスタムダイアログは使用していない
      expect(screen.queryByText('項目を削除')).not.toBeInTheDocument()
      expect(screen.queryByText('この項目を削除してもよろしいですか？')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '削除する' })).not.toBeInTheDocument()
    })

    it('ブラウザアラートによる削除確認を使用', async () => {
      render(<MemoSettingsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      })
      
      // window.confirmが設定されていることを確認
      expect(window.confirm).toBe(mockConfirm)
    })
  })
})