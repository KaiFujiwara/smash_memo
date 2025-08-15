/**
 * メモ内容サービス
 * 
 * MemoContentに関するビジネスロジックを集約したサービス層です。
 * AWS AmplifyのGraphQLAPIをラップして、型安全で使いやすいAPIを提供します。
 */

import { generateClient } from 'aws-amplify/api'
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

interface ListMemoContentsResponse {
  listMemoContents: {
    items: AmplifyMemoContent[]
    nextToken?: string | null
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

// GraphQLクエリ定義
const LIST_MEMO_CONTENTS_BY_ITEM_ID = `
  query ListMemoContentsByItemId($memoItemId: String!) {
    listMemoContents(filter: { memoItemId: { eq: $memoItemId } }) {
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
      nextToken
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
      variables: { memoItemId }
    }) as GraphQLResult<ListMemoContentsResponse>

    return response.data?.listMemoContents?.items || []
  } catch (error) {
    console.error('メモ内容の取得に失敗:', error)
    throw new Error('メモ内容の取得に失敗しました')
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