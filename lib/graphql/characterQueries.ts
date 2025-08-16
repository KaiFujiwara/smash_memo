/**
 * キャラクター関連のGraphQLクエリ
 */

import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import type { Character } from "@/types"

const client = generateClient<Schema>({
  authMode: 'apiKey'
})

/**
 * キャラクター一覧を取得
 */
export async function listCharacters(): Promise<Character[]> {
  try {
    console.log('キャラクター一覧を取得中...')
    const result = await client.models.Character.list()
    
    console.log('GraphQL結果:', { 
      dataCount: result.data?.length || 0, 
      errors: result.errors,
      firstItem: result.data?.[0] 
    })
    
    if (result.errors) {
      console.error('キャラクター一覧取得時にエラーが発生しました:', result.errors)
      throw new Error('キャラクター一覧の取得に失敗しました')
    }
    
    if (!result.data || result.data.length === 0) {
      console.warn('キャラクターデータが見つかりません')
      return []
    }
    
    // orderでソートして返す
    const characters = result.data
      .map(char => ({
        id: char.id,
        name: char.name,
        icon: char.icon,
        order: char.order,
        createdAt: char.createdAt,
        updatedAt: char.updatedAt
      }))
      .sort((a, b) => a.order - b.order)
      
    console.log(`${characters.length}件のキャラクターを取得しました`)
    return characters
      
  } catch (error) {
    console.error('キャラクター一覧の取得に失敗しました:', error)
    throw error
  }
}

/**
 * 特定のキャラクターを取得
 */
export async function getCharacter(id: string): Promise<Character | null> {
  try {
    const result = await client.models.Character.get({ id })
    
    if (result.errors) {
      console.error('キャラクター取得時にエラーが発生しました:', result.errors)
      throw new Error('キャラクターの取得に失敗しました')
    }
    
    if (!result.data) {
      return null
    }
    
    return {
      id: result.data.id,
      name: result.data.name,
      icon: result.data.icon,
      order: result.data.order,
      createdAt: result.data.createdAt,
      updatedAt: result.data.updatedAt
    }
    
  } catch (error) {
    console.error('キャラクターの取得に失敗しました:', error)
    throw error
  }
}