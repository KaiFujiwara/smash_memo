/**
 * カテゴリーセクションコンポーネント
 * 
 * 特定のカテゴリーに属するキャラクター一覧を表示するセクションです。
 * カテゴリー名の表示とキャラクターグリッドを含みます。
 */

'use client'

import { CharacterCard } from './CharacterCard'
import type { CharacterCategory, Character } from '@/types'
import type { DashboardMode } from '../types'

/**
 * カテゴリーセクションのプロパティ
 */
interface CategorySectionProps {
  /** 表示するカテゴリー */
  category: CharacterCategory
  /** カテゴリーに属するキャラクター一覧 */
  characters: Character[]
  /** 表示モード */
  mode: DashboardMode
  /** キャラクタークリック時のコールバック */
  onCharacterClick?: (character: Character) => void
  /** カテゴリー編集開始時のコールバック */
  onEditCategory?: (category: CharacterCategory) => void
}

/**
 * カテゴリーセクションコンポーネント
 */
export function CategorySection({
  category,
  characters,
  mode,
  onCharacterClick,
  onEditCategory
}: CategorySectionProps) {
  /**
   * カテゴリーヘッダークリック処理
   */
  const handleCategoryClick = () => {
    if (mode === 'edit' && onEditCategory) {
      onEditCategory(category)
    }
  }

  return (
    <div className="mb-8">
      {/* カテゴリーヘッダー */}
      <div 
        className={`
          flex items-center mb-4 pb-2 border-b-2
          ${mode === 'edit' ? 'cursor-pointer hover:opacity-75' : ''}
        `}
        style={{ borderColor: category.color }}
        onClick={handleCategoryClick}
      >
        {/* カテゴリーカラーインジケーター */}
        <div 
          className="w-4 h-4 rounded-full mr-3"
          style={{ backgroundColor: category.color }}
        />
        
        {/* カテゴリー名 */}
        <h2 className="text-lg font-semibold text-gray-800">
          {category.name}
        </h2>
        
        {/* キャラクター数 */}
        <span className="ml-2 text-sm text-gray-500">
          ({characters.length})
        </span>
        
        {/* 編集モードインジケーター */}
        {mode === 'edit' && (
          <span className="ml-auto text-xs text-gray-400">
            クリックして編集
          </span>
        )}
      </div>

      {/* キャラクターグリッド */}
      {characters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isEditMode={mode === 'edit'}
              onClick={onCharacterClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">このカテゴリーにはキャラクターがありません</p>
        </div>
      )}
    </div>
  )
}