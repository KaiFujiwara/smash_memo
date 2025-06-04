/**
 * キャラクターカードコンポーネント
 * 
 * 個別のキャラクターを表示するカードコンポーネントです。
 * クリックでメモ画面への遷移機能を提供します。
 */

'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import type { Character } from '@/types'

/**
 * キャラクターカードのプロパティ
 */
interface CharacterCardProps {
  /** 表示するキャラクター */
  character: Character
  /** 編集モードフラグ */
  isEditMode?: boolean
  /** クリック時のコールバック */
  onClick?: (character: Character) => void
}

/**
 * キャラクターカードコンポーネント
 */
export function CharacterCard({ 
  character, 
  isEditMode = false, 
  onClick 
}: CharacterCardProps) {
  const router = useRouter()

  /**
   * カードクリック処理
   */
  const handleClick = () => {
    if (onClick) {
      onClick(character)
    } else if (!isEditMode) {
      // メモ画面に遷移（TODO: 実際のメモ画面パスに更新）
      router.push(`/memo/${character.id}`)
    }
  }

  return (
    <Card 
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-200
        hover:shadow-lg hover:scale-105
        ${isEditMode ? 'opacity-75' : ''}
      `}
      onClick={handleClick}
    >
      <div className="aspect-square p-4 flex flex-col items-center justify-center">
        {/* キャラクター画像プレースホルダー */}
        <div className="w-16 h-16 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
          <span className="text-gray-500 text-xs">IMG</span>
        </div>
        
        {/* キャラクター名 */}
        <h3 className="text-sm font-medium text-center truncate w-full">
          {character.name}
        </h3>
      </div>
      
      {/* 編集モード時のオーバーレイ */}
      {isEditMode && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">編集モード</span>
        </div>
      )}
    </Card>
  )
}