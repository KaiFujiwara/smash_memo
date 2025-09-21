/**
 * キャラクター名の多言語表示ユーティリティ
 */

import type { Character } from '@/types'

/**
 * ロケールに応じたキャラクター名を取得
 */
export function getCharacterName(character: Character, locale: string): string {
  switch (locale) {
    case 'en':
      return character.nameEn || character.name
    case 'zh':
      return character.nameZh || character.name
    default:
      return character.name
  }
}

/**
 * キャラクター配列をロケールに応じてソート
 */
export function sortCharactersByName(characters: Character[], locale: string): Character[] {
  return [...characters].sort((a, b) => {
    const nameA = getCharacterName(a, locale)
    const nameB = getCharacterName(b, locale)
    return nameA.localeCompare(nameB, locale)
  })
}