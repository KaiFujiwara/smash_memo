'use client'

import { useState, useEffect } from 'react'
import { CharacterCard } from './components/CharacterCard'
import { fetchCharacters } from '@/services/characterService'
import Loading from '@/app/loading'
import type { Character } from '@/types'

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // キャラクターデータの読み込み
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setIsLoading(true)
        const charactersData = await fetchCharacters()
        setCharacters(charactersData)
      } catch (error) {
        console.error('キャラクターの読み込みに失敗:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCharacters()
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div>
      {/* キャラクターリスト */}
      {characters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">キャラクターが見つかりません</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-3">
          {characters.map((character) => (
            <CharacterCard 
              key={character.id} 
              character={character}
            />
          ))}
        </div>
      )}
    </div>
  )
}