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

