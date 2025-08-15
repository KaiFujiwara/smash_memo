/**
 * キャラクター関連のサービス層
 */

import { listCharacters, getCharacter } from '@/lib/graphql/characterQueries'
import type { Character } from '@/types'

/**
 * キャラクター一覧を取得
 */
export async function fetchCharacters(): Promise<Character[]> {
  try {
    return await listCharacters()
  } catch (error) {
    console.error('キャラクター一覧の取得に失敗しました:', error)
    // エラーが発生した場合は空配列を返す
    return []
  }
}

/**
 * 特定のキャラクターを取得
 */
export async function fetchCharacter(id: string): Promise<Character | null> {
  try {
    return await getCharacter(id)
  } catch (error) {
    console.error(`キャラクター(ID: ${id})の取得に失敗しました:`, error)
    return null
  }
}

/**
 * orderでソートされたキャラクター一覧を取得
 */
export async function fetchSortedCharacters(): Promise<Character[]> {
  const characters = await fetchCharacters()
  return characters.sort((a, b) => a.order - b.order)
}

/**
 * カテゴリー別にグループ化されたキャラクター一覧を取得
 */
export async function fetchCharactersByCategory(): Promise<Record<string, Character[]>> {
  const characters = await fetchCharacters()
  
  return characters.reduce((acc, character) => {
    const categoryId = character.categoryId || 'uncategorized'
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(character)
    return acc
  }, {} as Record<string, Character[]>)
}