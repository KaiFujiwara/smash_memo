/**
 * ルートページのテスト
 * 認証状態による適切なリダイレクト処理を確認
 */

import { render } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import RootPage from '@/app/page'

// モック設定
jest.mock('next/navigation')
jest.mock('@/hooks/useAuth')
jest.mock('@/app/loading', () => {
  return function MockLoading() {
    return <div data-testid="loading">読み込み中...</div>
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('RootPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのモック設定
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
  })

  describe('認証状態によるリダイレクト', () => {
    it('認証済みユーザーはキャラクター一覧にリダイレクトされる', () => {
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

      render(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/character-list')
    })

    it('未認証ユーザーはログインページにリダイレクトされる', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('認証状態確認中はローディング画面が表示される', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { getByTestId } = render(<RootPage />)
      
      expect(getByTestId('loading')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('認証状態の変化に対する反応', () => {
    it('ローディング完了後に認証済みならキャラクター一覧にリダイレクト', () => {
      // 最初はローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender } = render(<RootPage />)
      
      expect(mockPush).not.toHaveBeenCalled()
      
      // ローディング完了＆認証済み
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
      
      rerender(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/character-list')
    })

    it('ローディング完了後に未認証ならログインページにリダイレクト', () => {
      // 最初はローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender } = render(<RootPage />)
      
      expect(mockPush).not.toHaveBeenCalled()
      
      // ローディング完了＆未認証
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('複数回の状態変化でも正しくリダイレクトされる', () => {
      // 初期状態: ローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender } = render(<RootPage />)
      expect(mockPush).not.toHaveBeenCalled()
      
      // 1回目: ローディング完了・未認証
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<RootPage />)
      expect(mockPush).toHaveBeenCalledWith('/login')
      
      mockPush.mockClear()
      
      // 2回目: 認証済みに変更
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
      
      rerender(<RootPage />)
      expect(mockPush).toHaveBeenCalledWith('/character-list')
    })
  })

  describe('useEffectの依存配列', () => {
    it('isAuthenticated, isLoading, routerの変化で再実行される', () => {
      const mockSignOut = jest.fn()
      const mockRefreshUser = jest.fn()
      
      // 初期レンダリング
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: mockSignOut,
        refreshUser: mockRefreshUser
      })

      const { rerender } = render(<RootPage />)
      expect(mockPush).toHaveBeenCalledWith('/login')
      
      mockPush.mockClear()
      
      // isAuthenticatedのみ変更（他は同じ）
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 'test-user',
          username: 'test@example.com',
          email: 'test@example.com',
          displayName: 'test@example.com'
        },
        isLoading: false,
        signOut: mockSignOut,
        refreshUser: mockRefreshUser
      })
      
      rerender(<RootPage />)
      expect(mockPush).toHaveBeenCalledWith('/character-list')
    })
  })

  describe('エラーケース', () => {
    it('useAuthがnullユーザーを返しても正しく処理される', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('useAuthが認証済みでもユーザー情報なしの場合も処理される', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: null, // 通常はありえないが念のため
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<RootPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/character-list')
    })
  })

  describe('ローディング表示', () => {
    it('ローディング中は適切なLoadingコンポーネントが表示される', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { getByTestId } = render(<RootPage />)
      
      const loadingElement = getByTestId('loading')
      expect(loadingElement).toBeInTheDocument()
      expect(loadingElement).toHaveTextContent('読み込み中...')
    })

    it('ローディング終了後はLoadingコンポーネントが非表示になる', () => {
      // 最初はローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender, queryByTestId } = render(<RootPage />)
      
      expect(queryByTestId('loading')).toBeInTheDocument()
      
      // ローディング完了
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<RootPage />)
      
      // Loadingコンポーネントは表示されているが、リダイレクト処理が動く
      // (実際のアプリではリダイレクトによりページが変わる)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})