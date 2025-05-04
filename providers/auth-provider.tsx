'use client'

import { useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, fetchUserAttributes, signOut as amplifySignOut } from 'aws-amplify/auth'
import { AuthContext } from '@/contexts/auth-context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      const attributes = await fetchUserAttributes()
      setUser({
        ...currentUser,
        ...attributes,
        displayName: attributes.email || currentUser.username,
      })
      setIsAuthenticated(true)
    } catch (err: any) {
      if (err.name !== 'UserUnAuthenticatedException') {
        console.error('認証エラー:', err)
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await amplifySignOut()
    } catch (err) {
      console.error('サインアウト失敗:', err)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
