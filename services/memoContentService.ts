/**
 * メモ内容サービス
 * 
 * MemoContentに関するビジネスロジックを集約したサービス層です。
 * AWS AmplifyのGraphQLAPIをラップして、型安全で使いやすいAPIを提供します。
 */

import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import type { GraphQLResult } from '@aws-amplify/api-graphql'
import {
  LIST_MEMO_CONTENTS_BY_ITEM_ID,
  CREATE_MEMO_CONTENT,
  UPDATE_MEMO_CONTENT,
  DELETE_MEMO_CONTENT,
  GET_MEMO_CONTENTS_BY_CHARACTER_GSI
} from '@/lib/graphql/memoContentQueries'

// GraphQL レスポンスの型定義
interface AmplifyMemoContent {
  id: string
  characterId: string
  memoItemId: string
  content?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  owner?: string | null
  __typename: string
}


interface CreateMemoContentResponse {
  createMemoContent: AmplifyMemoContent
}

interface UpdateMemoContentResponse {
  updateMemoContent: AmplifyMemoContent
}

interface ListMemoContentsByMemoItemResponse {
  listMemoContentsByMemoItem: {
    items: AmplifyMemoContent[]
    __typename: string
  }
}


interface DeleteMemoContentResponse {
  deleteMemoContent: {
    id: string
    createdAt?: string | null
    updatedAt?: string | null
    owner?: string | null
    __typename: string
  }
}

// Amplify GraphQLクライアントのインスタンス
const client = generateClient()

// Helper function to get the federated identity owner format
async function getOwnerIdentifier(): Promise<string> {
  const user = await getCurrentUser()
  return `${user.userId}::${user.username}`
}


/**
 * 指定されたメモ項目IDに関連するすべてのメモ内容を取得します
 * 
 * @param memoItemId - メモ項目ID
 * @returns Promise<AmplifyMemoContent[]> 関連するメモ内容のリスト
 */
export async function getMemoContentsByItemId(memoItemId: string): Promise<AmplifyMemoContent[]> {
  try {
    const response = await client.graphql({
      query: LIST_MEMO_CONTENTS_BY_ITEM_ID,
      variables: { memoItemId },
      authMode: 'userPool'
    }) as GraphQLResult<ListMemoContentsByMemoItemResponse>

    return response.data?.listMemoContentsByMemoItem?.items || []
  } catch (error) {
    console.error('メモ内容の取得に失敗:', error)
    throw new Error('メモ内容の取得に失敗しました')
  }
}

/**
 * 特定のキャラクターのすべてのメモ内容を取得します
 * 
 * @param characterId - キャラクターID
 * @returns Promise<AmplifyMemoContent[]> キャラクターのメモ内容リスト
 */
export async function getMemoContentsByCharacter(characterId: string): Promise<AmplifyMemoContent[]> {
  const ownerId = await getOwnerIdentifier()
  
  try {
    // GSIでowner + characterId beginWithsで絞り込み（サーバー側）
    const response = await client.graphql({
      query: GET_MEMO_CONTENTS_BY_CHARACTER_GSI,
      variables: { 
        owner: ownerId,
        characterIdMemoItemId: {
          beginsWith: {
            characterId: characterId
          }
        }
      }
    }) as GraphQLResult<{ memoContentsByOwnerCharacter: { items: AmplifyMemoContent[] } }>

    const allItems = response.data?.memoContentsByOwnerCharacter?.items || []
    
    // memoItemIdごとにグループ化し、最新のupdatedAtのみ残す
    // バグが発生していたことによって、同じメモ項目に複数データが存在する可能性があるため、最新のもののみを取得
    const latestItemsMap = new Map<string, AmplifyMemoContent>()
    
    allItems.forEach(item => {
      const existing = latestItemsMap.get(item.memoItemId)
      if (!existing || (item.updatedAt && existing.updatedAt && item.updatedAt > existing.updatedAt)) {
        latestItemsMap.set(item.memoItemId, item)
      }
    })
    
    const latestItems = Array.from(latestItemsMap.values())
    
    return latestItems
  } catch (error) {
    console.error('キャラクターのメモ内容取得に失敗:', error)
    throw new Error('キャラクターのメモ内容取得に失敗しました')
  }
}


/**
 * メモ内容を作成します
 * 
 * @param input - 作成するメモ内容の情報
 * @returns Promise<AmplifyMemoContent> 作成されたメモ内容
 */
export async function createMemoContent(input: {
  characterId: string
  memoItemId: string
  content?: string
}): Promise<AmplifyMemoContent> {
  try {
    const response = await client.graphql({
      query: CREATE_MEMO_CONTENT,
      variables: { input }
    }) as GraphQLResult<CreateMemoContentResponse>

    if (!response.data?.createMemoContent) {
      throw new Error('メモ内容の作成に失敗しました')
    }

    return response.data.createMemoContent
  } catch (error) {
    console.error('メモ内容作成に失敗:', error)
    throw new Error('メモ内容作成に失敗しました')
  }
}

/**
 * メモ内容を更新します
 * 
 * @param input - 更新するメモ内容の情報
 * @returns Promise<AmplifyMemoContent> 更新されたメモ内容
 */
export async function updateMemoContent(input: {
  id: string
  content?: string
}): Promise<AmplifyMemoContent> {
  try {
    const response = await client.graphql({
      query: UPDATE_MEMO_CONTENT,
      variables: { input }
    }) as GraphQLResult<UpdateMemoContentResponse>

    if (!response.data?.updateMemoContent) {
      throw new Error('メモ内容の更新に失敗しました')
    }

    return response.data.updateMemoContent
  } catch (error) {
    console.error('メモ内容更新に失敗:', error)
    throw new Error('メモ内容更新に失敗しました')
  }
}




/**
 * 指定されたメモ項目IDに関連するすべてのメモ内容を削除します
 * 
 * @param memoItemId - メモ項目ID
 * @returns Promise<{ success: boolean; deletedCount: number; error?: string }>
 */
export async function deleteMemoContentsByItemId(memoItemId: string): Promise<{
  success: boolean
  deletedCount: number
  error?: string
}> {
  try {
    // 1. 関連するメモ内容を取得
    const memoContents = await getMemoContentsByItemId(memoItemId)
    
    if (memoContents.length === 0) {
      return {
        success: true,
        deletedCount: 0
      }
    }

    // 2. 全ての関連メモ内容を並列削除
    const deletePromises = memoContents.map(content =>
      client.graphql({
        query: DELETE_MEMO_CONTENT,
        variables: {
          input: { id: content.id }
        }
      }) as unknown as GraphQLResult<DeleteMemoContentResponse>
    )

    await Promise.all(deletePromises)

    return {
      success: true,
      deletedCount: memoContents.length
    }
  } catch (error) {
    console.error('メモ内容の一括削除に失敗:', error)
    return {
      success: false,
      deletedCount: 0,
      error: 'メモ内容の削除に失敗しました'
    }
  }
}