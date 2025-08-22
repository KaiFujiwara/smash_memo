/**
 * メモ内容サービス
 * 
 * MemoContentに関するビジネスロジックを集約したサービス層です。
 * AWS AmplifyのGraphQLAPIをラップして、型安全で使いやすいAPIを提供します。
 */

import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import type { GraphQLResult } from '@aws-amplify/api-graphql'

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

interface ListMemoContentsResponse {
  listMemoContents: {
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

// GSI対応GraphQLクエリ定義（シンプルなGSIのみ使用）
const LIST_MEMO_CONTENTS_BY_ITEM_ID = `
  query ListMemoContentsByMemoItem($memoItemId: String!) {
    listMemoContentsByMemoItem(memoItemId: $memoItemId) {
      items {
        id
        characterId
        memoItemId
        content
        createdAt
        updatedAt
        owner
        __typename
      }
    }
  }
`

// 複合キーGSIは問題があるため、基本的なフィルタクエリを使用
const LIST_MEMO_CONTENTS_BY_CHARACTER = `
  query ListMemoContentsByCharacter($filter: ModelMemoContentFilterInput) {
    listMemoContents(filter: $filter) {
      items {
        id
        characterId
        memoItemId
        content
        createdAt
        updatedAt
        owner
        __typename
      }
    }
  }
`

const CREATE_MEMO_CONTENT = `
  mutation CreateMemoContent($input: CreateMemoContentInput!) {
    createMemoContent(input: $input) {
      id
      characterId
      memoItemId
      content
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

const UPDATE_MEMO_CONTENT = `
  mutation UpdateMemoContent($input: UpdateMemoContentInput!) {
    updateMemoContent(input: $input) {
      id
      characterId
      memoItemId
      content
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

const DELETE_MEMO_CONTENT = `
  mutation DeleteMemoContent($input: DeleteMemoContentInput!) {
    deleteMemoContent(input: $input) {
      id
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

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
  try {
    const ownerId = await getOwnerIdentifier()
    
    const response = await client.graphql({
      query: LIST_MEMO_CONTENTS_BY_CHARACTER,
      variables: { 
        filter: {
          and: [
            { owner: { eq: ownerId } },
            { characterId: { eq: characterId } }
          ]
        }
      },
      authMode: 'userPool'
    }) as GraphQLResult<ListMemoContentsResponse>

    return response.data?.listMemoContents?.items || []
  } catch (error) {
    console.error('キャラクターのメモ内容取得に失敗:', error)
    throw new Error('キャラクターのメモ内容取得に失敗しました')
  }
}

/**
 * 特定のキャラクターとメモ項目の組み合わせでメモ内容を取得します
 * 
 * @param characterId - キャラクターID
 * @param memoItemId - メモ項目ID
 * @returns Promise<AmplifyMemoContent | null> メモ内容またはnull
 */
export async function getMemoContent(characterId: string, memoItemId: string): Promise<AmplifyMemoContent | null> {
  try {
    const ownerId = await getOwnerIdentifier()
    
    const response = await client.graphql({
      query: LIST_MEMO_CONTENTS_BY_CHARACTER,
      variables: { 
        filter: {
          and: [
            { owner: { eq: ownerId } },
            { characterId: { eq: characterId } },
            { memoItemId: { eq: memoItemId } }
          ]
        }
      },
      authMode: 'userPool'
    }) as GraphQLResult<ListMemoContentsResponse>

    const items = response.data?.listMemoContents?.items || []
    return items.length > 0 ? items[0] : null
  } catch (error) {
    console.error('メモ内容取得に失敗:', error)
    throw new Error('メモ内容取得に失敗しました')
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
 * メモ内容を作成または更新します（upsert）
 * 
 * @param characterId - キャラクターID
 * @param memoItemId - メモ項目ID
 * @param content - メモ内容
 * @param options - リクエストオプション
 * @returns Promise<AmplifyMemoContent> 作成または更新されたメモ内容
 */
export async function upsertMemoContent(
  characterId: string,
  memoItemId: string,
  content: string,
  options?: { keepalive?: boolean }
): Promise<AmplifyMemoContent> {
  try {
    // 離脱時の確実送信（keepalive）は呼び出し側で最適化版を使用

    // 通常の処理
    const existing = await getMemoContent(characterId, memoItemId)
    
    if (existing) {
      // 更新
      return await updateMemoContent({
        id: existing.id,
        content
      })
    } else {
      // 作成
      return await createMemoContent({
        characterId,
        memoItemId,
        content
      })
    }
  } catch (error) {
    console.error('メモ内容のupsertに失敗:', error)
    throw new Error('メモ内容の保存に失敗しました')
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