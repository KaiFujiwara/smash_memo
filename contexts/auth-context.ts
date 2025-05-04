import { createContext } from 'react'

export type AuthContextType = {
    user: {
      id: string
      email: string
      displayName: string
    } | null
    isAuthenticated: boolean
    isLoading: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
