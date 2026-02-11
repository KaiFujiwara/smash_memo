/**
 * memoContentService のテスト
 *
 * メモ内容サービスのビジネスロジックをテストします。
 * AWS Amplify GraphQL APIのモックを使用しています。
 */

// モックの実装を保持するオブジェクト
const mocks = {
  graphql: jest.fn(),
  getCurrentUser: jest.fn(),
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

// サービスのインポート
import {
  getMemoContentsByItemId,
  getMemoContentsByCharacter,
  createMemoContent,
  updateMemoContent,
  deleteMemoContentsByItemId,
} from '@/services/memoContentService'

describe('memoContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトのユーザー設定
    mocks.getCurrentUser.mockResolvedValue({
      userId: 'test-user-id',
      username: 'testuser',
    })
  })

  describe('getMemoContentsByItemId', () => {
    it('メモ項目IDに関連するメモ内容一覧を取得する', async () => {
      const mockContents = [
        {
          id: 'content-1',
          characterId: 'mario',
          memoItemId: 'item-1',
          content: 'マリオの立ち回りメモ',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          owner: 'test-user-id::testuser',
          __typename: 'MemoContent',
        },
        {
          id: 'content-2',
          characterId: 'link',
          memoItemId: 'item-1',
          content: 'リンクの立ち回りメモ',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          owner: 'test-user-id::testuser',
          __typename: 'MemoContent',
        },
      ]

      mocks.graphql.mockResolvedValue({
        data: {
          listMemoContentsByMemoItem: {
            items: mockContents,
            __typename: 'MemoContentConnection',
          },
        },
      })

      const result = await getMemoContentsByItemId('item-1')

      expect(result).toHaveLength(2)
      expect(result[0].content).toBe('マリオの立ち回りメモ')
      expect(result[1].content).toBe('リンクの立ち回りメモ')
    })

    it('メモ内容がない場合は空配列を返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          listMemoContentsByMemoItem: {
            items: [],
            __typename: 'MemoContentConnection',
          },
        },
      })

      const result = await getMemoContentsByItemId('item-1')

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は例外をスローする', async () => {
      mocks.graphql.mockRejectedValue(new Error('API error'))

      await expect(getMemoContentsByItemId('item-1')).rejects.toThrow(
        'メモ内容の取得に失敗しました'
      )
    })
  })

  describe('getMemoContentsByCharacter', () => {
    it('キャラクターIDに関連するメモ内容一覧を取得する', async () => {
      const mockContents = [
        {
          id: 'content-1',
          characterId: 'mario',
          memoItemId: 'item-1',
          content: '立ち回りメモ',
          updatedAt: '2024-01-02T00:00:00Z',
          __typename: 'MemoContent',
        },
        {
          id: 'content-2',
          characterId: 'mario',
          memoItemId: 'item-2',
          content: 'コンボメモ',
          updatedAt: '2024-01-01T00:00:00Z',
          __typename: 'MemoContent',
        },
      ]

      mocks.graphql.mockResolvedValue({
        data: {
          memoContentsByOwnerCharacter: {
            items: mockContents,
          },
        },
      })

      const result = await getMemoContentsByCharacter('mario')

      expect(result).toHaveLength(2)
      expect(mocks.getCurrentUser).toHaveBeenCalled()
    })

    it('同じmemoItemIdの重複データがある場合は最新のものだけを返す', async () => {
      const mockContents = [
        {
          id: 'content-1',
          characterId: 'mario',
          memoItemId: 'item-1',
          content: '古いデータ',
          updatedAt: '2024-01-01T00:00:00Z',
          __typename: 'MemoContent',
        },
        {
          id: 'content-2',
          characterId: 'mario',
          memoItemId: 'item-1',
          content: '新しいデータ',
          updatedAt: '2024-01-02T00:00:00Z',
          __typename: 'MemoContent',
        },
      ]

      mocks.graphql.mockResolvedValue({
        data: {
          memoContentsByOwnerCharacter: {
            items: mockContents,
          },
        },
      })

      const result = await getMemoContentsByCharacter('mario')

      expect(result).toHaveLength(1)
      expect(result[0].content).toBe('新しいデータ')
    })

    it('エラーが発生した場合は例外をスローする', async () => {
      mocks.graphql.mockRejectedValue(new Error('API error'))

      await expect(getMemoContentsByCharacter('mario')).rejects.toThrow(
        'キャラクターのメモ内容取得に失敗しました'
      )
    })
  })

  describe('createMemoContent', () => {
    it('メモ内容を作成する', async () => {
      const mockCreatedContent = {
        id: 'new-content-id',
        characterId: 'mario',
        memoItemId: 'item-1',
        content: '新しいメモ',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        owner: 'test-user-id::testuser',
        __typename: 'MemoContent',
      }

      mocks.graphql.mockResolvedValue({
        data: { createMemoContent: mockCreatedContent },
      })

      const result = await createMemoContent({
        characterId: 'mario',
        memoItemId: 'item-1',
        content: '新しいメモ',
      })

      expect(result.id).toBe('new-content-id')
      expect(result.content).toBe('新しいメモ')
    })

    it('作成に失敗した場合は例外をスローする', async () => {
      mocks.graphql.mockResolvedValue({
        data: { createMemoContent: null },
      })

      await expect(
        createMemoContent({
          characterId: 'mario',
          memoItemId: 'item-1',
          content: '新しいメモ',
        })
      ).rejects.toThrow('メモ内容作成に失敗しました')
    })

    it('APIエラーの場合は例外をスローする', async () => {
      mocks.graphql.mockRejectedValue(new Error('API error'))

      await expect(
        createMemoContent({
          characterId: 'mario',
          memoItemId: 'item-1',
          content: '新しいメモ',
        })
      ).rejects.toThrow('メモ内容作成に失敗しました')
    })
  })

  describe('updateMemoContent', () => {
    it('メモ内容を更新する', async () => {
      const mockUpdatedContent = {
        id: 'content-1',
        characterId: 'mario',
        memoItemId: 'item-1',
        content: '更新後のメモ',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        owner: 'test-user-id::testuser',
        __typename: 'MemoContent',
      }

      mocks.graphql.mockResolvedValue({
        data: { updateMemoContent: mockUpdatedContent },
      })

      const result = await updateMemoContent({
        id: 'content-1',
        content: '更新後のメモ',
      })

      expect(result.id).toBe('content-1')
      expect(result.content).toBe('更新後のメモ')
    })

    it('更新に失敗した場合は例外をスローする', async () => {
      mocks.graphql.mockResolvedValue({
        data: { updateMemoContent: null },
      })

      await expect(
        updateMemoContent({
          id: 'content-1',
          content: '更新後のメモ',
        })
      ).rejects.toThrow('メモ内容更新に失敗しました')
    })

    it('APIエラーの場合は例外をスローする', async () => {
      mocks.graphql.mockRejectedValue(new Error('API error'))

      await expect(
        updateMemoContent({
          id: 'content-1',
          content: '更新後のメモ',
        })
      ).rejects.toThrow('メモ内容更新に失敗しました')
    })
  })

  describe('deleteMemoContentsByItemId', () => {
    it('メモ項目に関連するメモ内容をすべて削除する', async () => {
      // getMemoContentsByItemId用のモック
      mocks.graphql
        .mockResolvedValueOnce({
          data: {
            listMemoContentsByMemoItem: {
              items: [
                { id: 'content-1', memoItemId: 'item-1' },
                { id: 'content-2', memoItemId: 'item-1' },
              ],
              __typename: 'MemoContentConnection',
            },
          },
        })
        // deleteMemoContent用のモック（2回分）
        .mockResolvedValueOnce({
          data: { deleteMemoContent: { id: 'content-1' } },
        })
        .mockResolvedValueOnce({
          data: { deleteMemoContent: { id: 'content-2' } },
        })

      const result = await deleteMemoContentsByItemId('item-1')

      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(2)
    })

    it('関連するメモ内容がない場合は0件で成功を返す', async () => {
      mocks.graphql.mockResolvedValue({
        data: {
          listMemoContentsByMemoItem: {
            items: [],
            __typename: 'MemoContentConnection',
          },
        },
      })

      const result = await deleteMemoContentsByItemId('item-1')

      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(0)
    })

    it('削除に失敗した場合はエラーを返す', async () => {
      mocks.graphql
        .mockResolvedValueOnce({
          data: {
            listMemoContentsByMemoItem: {
              items: [{ id: 'content-1', memoItemId: 'item-1' }],
              __typename: 'MemoContentConnection',
            },
          },
        })
        .mockRejectedValueOnce(new Error('Delete failed'))

      const result = await deleteMemoContentsByItemId('item-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('削除に失敗')
    })
  })
})
