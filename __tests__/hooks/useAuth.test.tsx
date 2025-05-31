/**
 * useAuth フックのテスト
 * 
 * このテストファイルでは、認証フックの動作を検証します。
 * React Hooksのテスト方法や、プロバイダーパターンのテスト手法を
 * 学ぶことができます。
 */

import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { AuthContext } from '@/contexts/authContext'
import type { AuthContextType } from '@/types'
import { ReactNode } from 'react'

// テスト用のモックデータを作成
const mockAuthContextValue: AuthContextType = {
  user: {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    email_verified: true,
  },
  isAuthenticated: true,
  isLoading: false,
  signOut: jest.fn(),
  refreshUser: jest.fn(),
}

/**
 * テスト用のプロバイダーコンポーネント
 * 
 * テスト実行時に使用するプロバイダーです。
 * 実際のAuthProviderではなく、テスト用のモックデータを提供します。
 */
const TestAuthProvider = ({ 
  children, 
  value = mockAuthContextValue 
}: { 
  children: ReactNode
  value?: AuthContextType | null 
}) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
)

describe('useAuth', () => {
  /**
   * テスト1: 正常なプロバイダー内でのフック使用
   * 
   * AuthProviderでラップされている場合、
   * 正しくコンテキストの値が取得できることを確認します。
   */
  it('プロバイダー内で使用した場合、認証情報を正しく取得できる', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestAuthProvider,
    })

    // 取得した値がモックデータと一致することを確認
    expect(result.current.user).toEqual(mockAuthContextValue.user)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(typeof result.current.signOut).toBe('function')
    expect(typeof result.current.refreshUser).toBe('function')
  })

  /**
   * テスト2: プロバイダー外でのフック使用エラー
   * 
   * AuthProviderでラップされていない場合、
   * 適切なエラーが発生することを確認します。
   */
  it('プロバイダー外で使用した場合、エラーが発生する', () => {
    // コンソールエラーを抑制（テスト実行時の出力をクリーンに保つため）
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    // スパイを復元
    consoleSpy.mockRestore()
  })

  /**
   * テスト3: 未認証状態の確認
   * 
   * ログインしていない状態の値が正しく取得できることを確認します。
   */
  it('未認証状態の場合、適切な値を返す', () => {
    const unauthenticatedValue: AuthContextType = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <TestAuthProvider value={unauthenticatedValue}>
          {children}
        </TestAuthProvider>
      ),
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  /**
   * テスト4: ローディング状態の確認
   * 
   * 認証状態を確認中の場合の値が正しく取得できることを確認します。
   */
  it('ローディング状態の場合、適切な値を返す', () => {
    const loadingValue: AuthContextType = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <TestAuthProvider value={loadingValue}>
          {children}
        </TestAuthProvider>
      ),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
}) 