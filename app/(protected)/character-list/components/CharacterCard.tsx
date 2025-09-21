/**
 * キャラクターカードコンポーネント
 * 
 * 個別のキャラクターを表示するカードコンポーネントです。
 * クリックでメモ画面への遷移機能を提供します。
 */

'use client'

import { useRouter } from 'next/navigation'
import { getCharacterName } from '@/lib/utils/characterNameUtils'
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import type { Character } from '@/types'
import jaTranslations from '../locales/ja.json'
import enTranslations from '../locales/en.json'
import zhTranslations from '../locales/zh.json'

/**
 * キャラクターカードのプロパティ
 */
interface CharacterCardProps {
  /** 表示するキャラクター */
  character: Character
}

/**
 * キャラクターカードコンポーネント
 */
export function CharacterCard({ 
  character
}: CharacterCardProps) {
  const router = useRouter()
  const { locale } = useProtectedTranslations(jaTranslations, enTranslations, zhTranslations)

  /**
   * カードクリック処理
   */
  const handleClick = () => {
    // メモ画面に遷移
    router.push(`/memo/${character.id}`)
  }

  return (
    <div 
      className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 rounded-full aspect-square"
      onClick={handleClick}
      title={getCharacterName(character, locale)}
    >
      {/* キャラクター画像 */}
      {character.icon ? (
        <img
          src={character.icon}
          alt={getCharacterName(character, locale)}
          className="w-full h-full object-contain rounded-full bg-white border-4 border-gray-400 hover:border-blue-600 transition-colors"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 rounded-full border-4 border-gray-400 flex items-center justify-center hover:border-blue-600 transition-colors">
          <span className="text-gray-500 text-xs">IMG</span>
        </div>
      )}
    </div>
  )
}