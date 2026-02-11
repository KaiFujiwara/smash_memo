/**
 * characterService のテスト
 *
 * キャラクターサービスのビジネスロジックをテストします。
 * GraphQLクエリのモックを使用しています。
 */

// モックの実装を保持するオブジェクト
const mocks = {
  listCharacters: jest.fn(),
  getCharacter: jest.fn(),
}

// GraphQL クエリのモック
jest.mock('@/lib/graphql/characterQueries', () => ({
  listCharacters: () => mocks.listCharacters(),
  getCharacter: (id: string) => mocks.getCharacter(id),
}))

// サービスのインポート
import { fetchCharacters, fetchCharacter } from '@/services/characterService'
import type { Character } from '@/types'

describe('characterService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchCharacters', () => {
    it('キャラクター一覧を取得する', async () => {
      const mockCharacters: Character[] = [
        {
          id: 'mario',
          name: 'マリオ',
          nameEn: 'Mario',
          nameZh: '马里奥',
          icon: '/icons/mario.png',
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'link',
          name: 'リンク',
          nameEn: 'Link',
          nameZh: '林克',
          icon: '/icons/link.png',
          order: 2,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]
      mocks.listCharacters.mockResolvedValue(mockCharacters)

      const result = await fetchCharacters()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('マリオ')
      expect(result[1].name).toBe('リンク')
    })

    it('キャラクターがいない場合は空配列を返す', async () => {
      mocks.listCharacters.mockResolvedValue([])

      const result = await fetchCharacters()

      expect(result).toEqual([])
    })

    it('エラーが発生した場合は空配列を返す', async () => {
      mocks.listCharacters.mockRejectedValue(new Error('API error'))

      const result = await fetchCharacters()

      expect(result).toEqual([])
    })
  })

  describe('fetchCharacter', () => {
    it('指定されたIDのキャラクターを取得する', async () => {
      const mockCharacter: Character = {
        id: 'mario',
        name: 'マリオ',
        nameEn: 'Mario',
        nameZh: '马里奥',
        icon: '/icons/mario.png',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      mocks.getCharacter.mockResolvedValue(mockCharacter)

      const result = await fetchCharacter('mario')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('mario')
      expect(result?.name).toBe('マリオ')
      expect(mocks.getCharacter).toHaveBeenCalledWith('mario')
    })

    it('存在しないIDの場合はnullを返す', async () => {
      mocks.getCharacter.mockResolvedValue(null)

      const result = await fetchCharacter('non-existent-id')

      expect(result).toBeNull()
    })

    it('エラーが発生した場合はnullを返す', async () => {
      mocks.getCharacter.mockRejectedValue(new Error('API error'))

      const result = await fetchCharacter('mario')

      expect(result).toBeNull()
    })
  })
})
