/**
 * キャラクター名の多言語表示ロジックのテスト
 */

import { getCharacterName, sortCharactersByName } from '@/lib/utils/characterNameUtils'
import type { Character } from '@/types'

describe('characterNameUtils', () => {
  describe('getCharacterName', () => {
    const mockCharacter: Character = {
      id: '1',
      name: 'マリオ',
      nameEn: 'Mario',
      nameZh: '马力欧',
      icon: 'mario.png',
      order: 1
    }

    it('日本語ロケールの場合、nameを返す', () => {
      expect(getCharacterName(mockCharacter, 'ja')).toBe('マリオ')
    })

    it('英語ロケールの場合、nameEnを返す', () => {
      expect(getCharacterName(mockCharacter, 'en')).toBe('Mario')
    })

    it('中国語ロケールの場合、nameZhを返す', () => {
      expect(getCharacterName(mockCharacter, 'zh')).toBe('马力欧')
    })

    it('nameEnがない場合、nameをフォールバックとして返す', () => {
      const characterWithoutEn: Character = {
        id: '2',
        name: 'ルイージ',
        icon: 'luigi.png',
        order: 2
      }
      expect(getCharacterName(characterWithoutEn, 'en')).toBe('ルイージ')
    })

    it('nameZhがない場合、nameをフォールバックとして返す', () => {
      const characterWithoutZh: Character = {
        id: '3',
        name: 'ピカチュウ',
        icon: 'pikachu.png',
        order: 3
      }
      expect(getCharacterName(characterWithoutZh, 'zh')).toBe('ピカチュウ')
    })

    it('未知のロケールの場合、nameを返す', () => {
      expect(getCharacterName(mockCharacter, 'fr')).toBe('マリオ')
    })
  })

  describe('sortCharactersByName', () => {
    const mockCharacters: Character[] = [
      {
        id: '1',
        name: 'ルイージ',
        nameEn: 'Luigi',
        nameZh: '路易吉',
        icon: 'luigi.png',
        order: 2
      },
      {
        id: '2',
        name: 'マリオ',
        nameEn: 'Mario',
        nameZh: '马力欧',
        icon: 'mario.png',
        order: 1
      },
      {
        id: '3',
        name: 'ピカチュウ',
        nameEn: 'Pikachu',
        nameZh: '皮卡丘',
        icon: 'pikachu.png',
        order: 3
      }
    ]

    it('日本語ロケールでソートする', () => {
      const sorted = sortCharactersByName(mockCharacters, 'ja')
      expect(sorted[0].name).toBe('ピカチュウ')
      expect(sorted[1].name).toBe('マリオ')
      expect(sorted[2].name).toBe('ルイージ')
    })

    it('英語ロケールでソートする', () => {
      const sorted = sortCharactersByName(mockCharacters, 'en')
      expect(sorted[0].nameEn).toBe('Luigi')
      expect(sorted[1].nameEn).toBe('Mario')
      expect(sorted[2].nameEn).toBe('Pikachu')
    })

    it('元の配列は変更しない', () => {
      const original = [...mockCharacters]
      sortCharactersByName(mockCharacters, 'ja')
      expect(mockCharacters).toEqual(original)
    })

    it('空の配列を渡しても正常に動作する', () => {
      const sorted = sortCharactersByName([], 'ja')
      expect(sorted).toEqual([])
    })

    it('1つの要素の配列も正常に動作する', () => {
      const single = [mockCharacters[0]]
      const sorted = sortCharactersByName(single, 'ja')
      expect(sorted).toEqual(single)
    })

    it('nameEnがない場合、nameでソートする', () => {
      const charactersWithoutEn: Character[] = [
        { id: '1', name: 'ルイージ', icon: '', order: 2 },
        { id: '2', name: 'マリオ', icon: '', order: 1 }
      ]
      const sorted = sortCharactersByName(charactersWithoutEn, 'en')
      expect(sorted[0].name).toBe('マリオ')
      expect(sorted[1].name).toBe('ルイージ')
    })
  })
})
