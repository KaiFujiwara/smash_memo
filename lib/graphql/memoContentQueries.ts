/**
 * MemoContent GraphQLクエリ定義
 */

export const LIST_MEMO_CONTENTS_BY_ITEM_ID = `
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

export const CREATE_MEMO_CONTENT = `
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

export const UPDATE_MEMO_CONTENT = `
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

export const DELETE_MEMO_CONTENT = `
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

export const GET_MEMO_CONTENTS_BY_CHARACTER_GSI = `
  query GetMemoContentsByCharacter(
    $owner: String!, 
    $characterIdMemoItemId: ModelMemoContentMemoContentsByOwnerAndCharacterIdAndMemoItemIdCompositeKeyConditionInput!
  ) {
    memoContentsByOwnerCharacter(owner: $owner, characterIdMemoItemId: $characterIdMemoItemId, sortDirection: ASC) {
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