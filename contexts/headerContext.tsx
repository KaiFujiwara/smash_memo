'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Character } from '@/types'

interface HeaderContextType {
  characterName: string | null
  characterIcon: string | null
  currentCharacter: Character | null
  setCharacterName: (name: string | null) => void
  setCharacterIcon: (icon: string | null) => void
  setCurrentCharacter: (character: Character | null) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [characterName, setCharacterName] = useState<string | null>(null)
  const [characterIcon, setCharacterIcon] = useState<string | null>(null)
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)

  return (
    <HeaderContext.Provider value={{ 
      characterName, 
      characterIcon, 
      currentCharacter,
      setCharacterName, 
      setCharacterIcon,
      setCurrentCharacter 
    }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}