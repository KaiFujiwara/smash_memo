/**
 * characterServiceのテスト
 * キャラクター関連のビジネスロジックを確認
 */

import { fetchCharacters, fetchCharacter } from '@/services/characterService'
import { listCharacters, getCharacter } from '@/lib/graphql/characterQueries'
import type { Character } from '@/types'

// GraphQLクエリをモック
jest.mock('@/lib/graphql/characterQueries')

const mockListCharacters = listCharacters as jest.MockedFunction<typeof listCharacters>
const mockGetCharacter = getCharacter as jest.MockedFunction<typeof getCharacter>

// サンプルデータ
const sampleCharacters: Character[] = [
  { id: '1', name: 'マリオ', icon: 'mario.png', order: 1, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
  { id: '2', name: 'ルイージ', icon: 'luigi.png', order: 2, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
  { id: '3', name: 'ピカチュウ', icon: 'pikachu.png', order: 3, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
]

const sampleCharacter: Character = { id: '1', name: 'マリオ', icon: 'mario.png', order: 1, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }

describe('characterService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // console.errorをモック
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('fetchCharacters', () => {
    it('キャラクター一覧を正常に取得できる', async () => {
      mockListCharacters.mockResolvedValue(sampleCharacters)

      const result = await fetchCharacters()

      expect(mockListCharacters).toHaveBeenCalledTimes(1)
      expect(result).toEqual(sampleCharacters)
    })

    it('エラー発生時は空配列を返す', async () => {
      const error = new Error('API error')
      mockListCharacters.mockRejectedValue(error)

      const result = await fetchCharacters()

      expect(mockListCharacters).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'キャラクター一覧の取得に失敗しました:',
        error
      )
    })

    it('空配列が返された場合も正常に処理される', async () => {
      mockListCharacters.mockResolvedValue([])

      const result = await fetchCharacters()

      expect(result).toEqual([])
    })
  })

  describe('fetchCharacter', () => {
    it('特定のキャラクターを正常に取得できる', async () => {
      mockGetCharacter.mockResolvedValue(sampleCharacter)

      const result = await fetchCharacter('1')

      expect(mockGetCharacter).toHaveBeenCalledWith('1')
      expect(result).toEqual(sampleCharacter)
    })

    it('存在しないキャラクターIDの場合はnullを返す', async () => {
      mockGetCharacter.mockResolvedValue(null)

      const result = await fetchCharacter('999')

      expect(mockGetCharacter).toHaveBeenCalledWith('999')
      expect(result).toBeNull()
    })

    it('エラー発生時はnullを返す', async () => {
      const error = new Error('API error')
      mockGetCharacter.mockRejectedValue(error)

      const result = await fetchCharacter('1')

      expect(mockGetCharacter).toHaveBeenCalledWith('1')
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'キャラクター(ID: 1)の取得に失敗しました:',
        error
      )
    })

    it('空文字のIDでも適切に処理される', async () => {
      mockGetCharacter.mockResolvedValue(null)

      const result = await fetchCharacter('')

      expect(mockGetCharacter).toHaveBeenCalledWith('')
      expect(result).toBeNull()
    })
  })
})