/**
 * メモ項目関連のGraphQLクエリ定義
 * 
 * AWS AmplifyのGraphQLクエリとミューテーションを一箇所に集約して管理します。
 * このファイルにより、クエリの再利用性と保守性が向上します。
 */

/**
 * GSIを使用してユーザーのメモ項目一覧を取得するクエリ
 */
export const LIST_MEMO_ITEMS_BY_OWNER = `
  query MemoItemsByOwner(
    $owner: String!
    $sortDirection: ModelSortDirection
    $filter: ModelMemoItemFilterInput
  ) {
    memoItemsByOwner(
      owner: $owner
      sortDirection: $sortDirection
      filter: $filter
    ) {
      items {
        id
        name
        order
        visible
        createdAt
        updatedAt
        owner
        __typename
      }
    }
  }
`

/**
 * 特定のメモ項目を取得するクエリ
 */
export const GET_MEMO_ITEM = `
  query GetMemoItem($id: ID!) {
    getMemoItem(id: $id) {
      id
      name
      order
      visible
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

/**
 * メモ項目を作成するミューテーション
 * 
 * 新しいメモ項目をDynamoDBに保存します。
 * orderフィールドによって表示順序を制御できます。
 */
export const CREATE_MEMO_ITEM = `
  mutation CreateMemoItem($input: CreateMemoItemInput!, $condition: ModelMemoItemConditionInput) {
    createMemoItem(input: $input, condition: $condition) {
      id
      name
      order
      visible
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

/**
 * メモ項目を更新するミューテーション
 * 
 * 既存のメモ項目の名前、順序、表示設定を更新します。
 * 楽観的排他制御のため_versionフィールドが必要です。
 */
export const UPDATE_MEMO_ITEM = `
  mutation UpdateMemoItem($input: UpdateMemoItemInput!, $condition: ModelMemoItemConditionInput) {
    updateMemoItem(input: $input, condition: $condition) {
      id
      name
      order
      visible
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

/**
 * メモ項目を削除するミューテーション
 * 
 * 指定されたメモ項目をDynamoDBから削除します。
 * 楽観的排他制御のため_versionフィールドが必要です。
 */
export const DELETE_MEMO_ITEM = `
  mutation DeleteMemoItem($input: DeleteMemoItemInput!, $condition: ModelMemoItemConditionInput) {
    deleteMemoItem(input: $input, condition: $condition) {
      id
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`

/**
 * GraphQLクエリのフィルター定義
 * 
 * 共通で使用されるフィルター条件を定義しています。
 */
export const MEMO_ITEM_FILTERS = {
  /** 表示可能な項目のみを取得 */
  VISIBLE_ONLY: {
    visible: { eq: true }
  },
  
  /** 特定の順序範囲の項目を取得 */
  ORDER_RANGE: (min: number, max: number) => ({
    order: { between: [min, max] }
  }),
  
  /** 名前で部分一致検索 */
  NAME_CONTAINS: (searchTerm: string) => ({
    name: { contains: searchTerm }
  })
} as const 