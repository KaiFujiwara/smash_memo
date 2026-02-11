/**
 * memoItemService のテスト
 *
 * メモ項目サービスのビジネスロジックをテストします。
 * AWS Amplify GraphQL APIのモックを使用しています。
 */

// モックの実装を保持するオブジェクト
const mocks = {
  graphql: jest.fn(),
  getCurrentUser: jest.fn(),
  deleteMemoContentsByItemId: jest.fn(),
  getMemoContentsByItemId: jest.fn(),
  deleteMemoImagesByContent: jest.fn(),
}

// Amplify API クライアントのモック
jest.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: (...args: unknown[]) => mocks.graphql(...args),
  }),
}))

// Amplify Auth のモック
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: () => mocks.getCurrentUser(),
}))

// memoContentService のモック
jest.mock('@/services/memoContentService', () => ({
  deleteMemoContentsByItemId: (...args: unknown[]) => mocks.deleteMemoContentsByItemId(...args),
  getMemoContentsByItemId: (...args: unknown[]) => mocks.getMemoContentsByItemId(...args),
}))

// memoImageService のモック
jest.mock('@/services/memoImageService', () => ({
  deleteMemoImagesByContent: (...args: unknown[]) => mocks.deleteMemoImagesByContent(...args),
}))

// サービスのインポート
import {
  getMemoItems,
  getMemoItem,
  createMemoItem,
  updateMemoItem,
  deleteMemoItem,
  deleteMemoItemCascade,
  bulkUpdateMemoItemOrder,
  getNextOrder,
} from '@/services/memoItemService'

describe('memoItemService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトのユーザー設定
    mocks.getCurrentUser.mockResolvedValue({ userId: 'test-user-id' })
  })

  describe('getMemoItems', () => {
    it('メモ項目一覧を取得する', async () => {
      const mockItems = [
        {
          id: 'item-1',
          name: '立ち回り',
          order: 1,
          visible: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          owner: 'test-user-id',
          __typename: 'MemoItem',
        },
        {
          id: 'item-2',
          name: 'コンボ',
          order: 2,
          visible: true,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          owner: 'test-user-id',
          __typename: 'MemoItem',
        },
      ]

      mocks.graphql.mockResolvedValue({
        data: {
          memoItemsByOwner: {
            items: mockItems,
            __typename: 'MemoItemConnection',
          },
        },
      })

      const result = await getMemoItems()

      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('立ち回り')
      expect(result.items[1].name).toBe('コンボ')
    })

    it('visibleOnlyオプションで表示中の項目のみ取得する', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          memoItemsByOwner: {
            items: [
              {
                id: 'item-1',
                name: '立ち回り',
                order: 1,
                visible: true,
                __typename: 'MemoItem',
              },
            ],
            __typename: 'MemoItemConnection',
          },
        },
      })

      await getMemoItems({ visibleOnly: true })

      expect(mocks.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            filter: expect.objectContaining({
              visible: { eq: true },
            }),
          }),
        })
      )
    })

    it('項目がない場合は空配列を返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          memoItemsByOwner: {
            items: [],
            __typename: 'MemoItemConnection',
          },
        },
      })

      const result = await getMemoItems()

      expect(result.items).toEqual([])
    })
  })

  describe('getMemoItem', () => {
    it('指定されたIDのメモ項目を取得する', async () => {
      const mockItem = {
        id: 'item-1',
        name: '立ち回り',
        order: 1,
        visible: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        owner: 'test-user-id',
        __typename: 'MemoItem',
      }

      mocks.graphql.mockResolvedValue({
        data: { getMemoItem: mockItem },
      })

      const result = await getMemoItem('item-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('item-1')
      expect(result?.name).toBe('立ち回り')
    })

    it('存在しないIDの場合はnullを返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: { getMemoItem: null },
      })

      const result = await getMemoItem('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('createMemoItem', () => {
    it('メモ項目を作成する', async () => {
      const mockCreatedItem = {
        id: 'new-item-id',
        name: '新しい項目',
        order: 3,
        visible: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        owner: 'test-user-id',
        __typename: 'MemoItem',
      }

      mocks.graphql.mockResolvedValueOnce({
        data: { createMemoItem: mockCreatedItem },
      })

      const result = await createMemoItem({ name: '新しい項目', order: 3 })

      expect(result.success).toBe(true)
      expect(result.item?.name).toBe('新しい項目')
      expect(result.item?.order).toBe(3)
    })

    it('空の名前の場合はエラーを返す', async () => {
      const result = await createMemoItem({ name: '', order: 0 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('メモ項目名')
    })
  })

  describe('updateMemoItem', () => {
    it('メモ項目を更新する', async () => {
      const mockUpdatedItem = {
        id: 'item-1',
        name: '更新後の名前',
        order: 1,
        visible: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        owner: 'test-user-id',
        __typename: 'MemoItem',
      }

      mocks.graphql.mockResolvedValue({
        data: { updateMemoItem: mockUpdatedItem },
      })

      const result = await updateMemoItem({ id: 'item-1', name: '更新後の名前' })

      expect(result.success).toBe(true)
      expect(result.item?.name).toBe('更新後の名前')
    })

    it('空の名前の場合はエラーを返す', async () => {
      const result = await updateMemoItem({ id: 'item-1', name: '' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('項目名')
    })
  })

  describe('deleteMemoItem', () => {
    it('メモ項目を削除する', async () => {
      mocks.graphql.mockResolvedValue({
        data: { deleteMemoItem: { id: 'item-1' } },
      })

      const result = await deleteMemoItem({ id: 'item-1' })

      expect(result.success).toBe(true)
    })
  })

  describe('deleteMemoItemCascade', () => {
    it('メモ項目と関連するメモ内容・画像をすべて削除する', async () => {
      // getMemoContentsByItemIdのモック
      mocks.getMemoContentsByItemId.mockResolvedValue([
        { id: 'content-1', characterId: 'char-1', memoItemId: 'item-1' },
        { id: 'content-2', characterId: 'char-2', memoItemId: 'item-1' },
      ])

      // deleteMemoImagesByContentのモック（各コンテンツごとに呼ばれる）
      mocks.deleteMemoImagesByContent
        .mockResolvedValueOnce({ success: true, deletedCount: 2 })
        .mockResolvedValueOnce({ success: true, deletedCount: 1 })

      // deleteMemoContentsByItemIdのモック
      mocks.deleteMemoContentsByItemId.mockResolvedValue({
        success: true,
        deletedCount: 2,
      })

      // deleteMemoItem用のGraphQLモック
      mocks.graphql.mockResolvedValue({
        data: { deleteMemoItem: { id: 'item-1' } },
      })

      const result = await deleteMemoItemCascade({ id: 'item-1' })

      expect(result.success).toBe(true)
      expect(result.deletedMemoContentsCount).toBe(2)
      expect(result.deletedMemoImagesCount).toBe(3) // 2 + 1
      expect(mocks.deleteMemoImagesByContent).toHaveBeenCalledTimes(2)
      expect(mocks.deleteMemoContentsByItemId).toHaveBeenCalledWith('item-1')
    })

    it('関連するメモ内容がない場合も正常に削除する', async () => {
      mocks.getMemoContentsByItemId.mockResolvedValue([])
      mocks.deleteMemoContentsByItemId.mockResolvedValue({
        success: true,
        deletedCount: 0,
      })
      mocks.graphql.mockResolvedValue({
        data: { deleteMemoItem: { id: 'item-1' } },
      })

      const result = await deleteMemoItemCascade({ id: 'item-1' })

      expect(result.success).toBe(true)
      expect(result.deletedMemoContentsCount).toBe(0)
      expect(result.deletedMemoImagesCount).toBe(0)
      expect(mocks.deleteMemoImagesByContent).not.toHaveBeenCalled()
    })

    it('メモ内容の削除に失敗した場合はエラーを返す', async () => {
      mocks.getMemoContentsByItemId.mockResolvedValue([
        { id: 'content-1', characterId: 'char-1', memoItemId: 'item-1' },
      ])
      mocks.deleteMemoImagesByContent.mockResolvedValue({
        success: true,
        deletedCount: 0,
      })
      mocks.deleteMemoContentsByItemId.mockResolvedValue({
        success: false,
        error: 'メモ内容の削除に失敗しました',
      })

      const result = await deleteMemoItemCascade({ id: 'item-1' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('メモ内容の削除に失敗')
    })

    it('画像の削除に一部失敗しても処理を続行する', async () => {
      mocks.getMemoContentsByItemId.mockResolvedValue([
        { id: 'content-1', characterId: 'char-1', memoItemId: 'item-1' },
        { id: 'content-2', characterId: 'char-2', memoItemId: 'item-1' },
      ])
      // 1つ目は成功、2つ目は失敗
      mocks.deleteMemoImagesByContent
        .mockResolvedValueOnce({ success: true, deletedCount: 2 })
        .mockResolvedValueOnce({ success: false, deletedCount: 0, error: 'エラー' })
      mocks.deleteMemoContentsByItemId.mockResolvedValue({
        success: true,
        deletedCount: 2,
      })
      mocks.graphql.mockResolvedValue({
        data: { deleteMemoItem: { id: 'item-1' } },
      })

      const result = await deleteMemoItemCascade({ id: 'item-1' })

      // 画像削除の失敗は無視して処理を続行
      expect(result.success).toBe(true)
      expect(result.deletedMemoImagesCount).toBe(2) // 成功分のみカウント
    })
  })

  describe('bulkUpdateMemoItemOrder', () => {
    it('複数のメモ項目の順序を一括更新する', async () => {
      mocks.graphql
        .mockResolvedValueOnce({
          data: { updateMemoItem: { id: 'item-1', order: 2 } },
        })
        .mockResolvedValueOnce({
          data: { updateMemoItem: { id: 'item-2', order: 1 } },
        })

      const result = await bulkUpdateMemoItemOrder([
        { id: 'item-1', order: 2 },
        { id: 'item-2', order: 1 },
      ])

      expect(result.success).toBe(true)
      expect(mocks.graphql).toHaveBeenCalledTimes(2)
    })

    it('空配列の場合は何もせず成功を返す', async () => {
      const result = await bulkUpdateMemoItemOrder([])

      expect(result.success).toBe(true)
      expect(mocks.graphql).not.toHaveBeenCalled()
    })

    it('更新に失敗した場合はエラーを返す', async () => {
      mocks.graphql.mockRejectedValue(new Error('Update failed'))

      const result = await bulkUpdateMemoItemOrder([
        { id: 'item-1', order: 2 },
      ])

      expect(result.success).toBe(false)
      expect(result.error).toContain('順序更新に失敗')
    })
  })

  describe('getNextOrder', () => {
    it('既存の項目がある場合は最大order+1を返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          memoItemsByOwner: {
            items: [
              { id: 'item-1', order: 1 },
              { id: 'item-2', order: 5 },
              { id: 'item-3', order: 3 },
            ],
            __typename: 'MemoItemConnection',
          },
        },
      })

      const result = await getNextOrder()

      expect(result).toBe(6) // max(1,5,3) + 1 = 6
    })

    it('項目がない場合は0を返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          memoItemsByOwner: {
            items: [],
            __typename: 'MemoItemConnection',
          },
        },
      })

      const result = await getNextOrder()

      expect(result).toBe(0)
    })

    it('エラーが発生した場合は0を返す', async () => {
      mocks.graphql.mockRejectedValue(new Error('API error'))

      const result = await getNextOrder()

      expect(result).toBe(0)
    })
  })
})
