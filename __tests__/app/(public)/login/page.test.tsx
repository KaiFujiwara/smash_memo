/**
 * ログインページのテスト
 * サインイン機能、認証リダイレクト、UIテストを確認
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { signInWithRedirect } from 'aws-amplify/auth'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/app/(public)/login/page'

// モック設定
jest.mock('next/navigation')
jest.mock('aws-amplify/auth')
jest.mock('@/hooks/useAuth')
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height }: any) => <img src={src} alt={alt} width={width} height={height} />
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockSignInWithRedirect = signInWithRedirect as jest.MockedFunction<typeof signInWithRedirect>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LoginPage', () => {
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
    
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
  })

  describe('認証状態による表示', () => {
    it('未認証の場合、ログインフォームが表示される', () => {
      render(<LoginPage />)
      
      expect(screen.getByAltText('すまめも')).toBeInTheDocument()
      expect(screen.getByText('スマブラSPのキャラ対策メモアプリ')).toBeInTheDocument()
      expect(screen.getByText('スマブラSPの対戦キャラごとに対策メモを残せるアプリです。')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Googleでログイン' })).toBeInTheDocument()
    })

    it('認証状態確認中はローディング画面が表示される', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<LoginPage />)
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Googleでログイン' })).not.toBeInTheDocument()
    })

    it('認証済みの場合、ダッシュボードにリダイレクトされる', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 'test-user',
          username: 'test@example.com',
          email: 'test@example.com'
        },
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      render(<LoginPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('サインイン機能', () => {
    it('ログインボタンクリックでsignInWithRedirectが呼ばれる', async () => {
      mockSignInWithRedirect.mockResolvedValue()

      render(<LoginPage />)
      
      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(mockSignInWithRedirect).toHaveBeenCalledWith({
          provider: { 
            custom: 'Google'
          }
        })
      })
    })

    it('サインイン中はローディング状態が表示される', async () => {
      mockSignInWithRedirect.mockImplementation(() => new Promise(() => {})) // 保留状態

      render(<LoginPage />)
      
      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText('ログイン中...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'ログイン中...' })).toBeDisabled()
      })
    })

    it('サインインエラー時にボタンが再有効化される', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSignInWithRedirect.mockRejectedValue(new Error('サインインエラー'))

      render(<LoginPage />)
      
      const loginButton = screen.getByRole('button', { name: 'Googleでログイン' })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Googleサインインエラー:', expect.any(Error))
        expect(screen.getByRole('button', { name: 'Googleでログイン' })).not.toBeDisabled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('UI要素', () => {
    beforeEach(() => {
      render(<LoginPage />)
    })

    it('ロゴ画像が表示される', () => {
      const logo = screen.getByAltText('すまめも')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/logo.svg')
    })

    it('利用規約とプライバシーポリシーのリンクが表示される', () => {
      expect(screen.getByText('利用規約')).toBeInTheDocument()
      expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument()
      
      const termsLink = screen.getByRole('link', { name: '利用規約' })
      const privacyLink = screen.getByRole('link', { name: 'プライバシーポリシー' })
      
      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    })

  })

  describe('認証状態の変化', () => {
    it('認証状態が未認証から認証済みに変わった時にリダイレクトされる', () => {
      const { rerender } = render(<LoginPage />)
      
      // 初期は未認証でリダイレクトされない
      expect(mockPush).not.toHaveBeenCalled()
      
      // 認証済みに変更
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 'test-user',
          username: 'test@example.com', 
          email: 'test@example.com'
        },
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<LoginPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('ローディング中から認証済みに変わった時もリダイレクトされる', () => {
      // 最初はローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender } = render(<LoginPage />)
      
      expect(mockPush).not.toHaveBeenCalled()
      
      // ローディング完了＆認証済み
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: 'test-user',
          username: 'test@example.com',
          email: 'test@example.com'
        },
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<LoginPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('ローディング完了後も未認証ならログインフォームが表示される', () => {
      // 最初はローディング中
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })

      const { rerender } = render(<LoginPage />)
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
      
      // ローディング完了＆未認証
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn()
      })
      
      rerender(<LoginPage />)
      
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Googleでログイン' })).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})