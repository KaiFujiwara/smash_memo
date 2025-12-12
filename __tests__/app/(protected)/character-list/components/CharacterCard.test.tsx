/**
 * CharacterCardコンポーネントのテスト
 * キャラクターカードの表示と操作を確認
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { CharacterCard } from '@/app/(protected)/character-list/components/CharacterCard'
import type { Character } from '@/types'

// Next.jsのuseRouterをモック
jest.mock('next/navigation')

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('CharacterCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
  })

  describe('基本的な表示', () => {
    const sampleCharacter: Character = {
      id: '1',
      name: 'マリオ',
      icon: 'mario.png',
      order: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    it('キャラクター情報が正しく表示される', () => {
      render(<CharacterCard character={sampleCharacter} />)

      const image = screen.getByAltText('マリオ')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'mario.png')

      const cardElement = screen.getByTitle('マリオ')
      expect(cardElement).toBeInTheDocument()
    })

    it('アイコンがない場合はプレースホルダーを表示する', () => {
      const characterWithoutIcon: Character = {
        id: '2',
        name: 'ルイージ',
        icon: '',
        order: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(<CharacterCard character={characterWithoutIcon} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('IMG')).toBeInTheDocument()
      expect(screen.getByTitle('ルイージ')).toBeInTheDocument()
    })

    it('アイコンがnullの場合もプレースホルダーを表示する', () => {
      const characterWithNullIcon: Character = {
        id: '3',
        name: 'ピカチュウ',
        icon: null as any,
        order: 3,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(<CharacterCard character={characterWithNullIcon} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('IMG')).toBeInTheDocument()
    })
  })

  describe('クリック操作', () => {
    const sampleCharacter: Character = {
      id: 'mario',
      name: 'マリオ',
      icon: 'mario.png',
      order: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    it('カードクリック時にメモページに遷移する', () => {
      render(<CharacterCard character={sampleCharacter} />)

      const card = screen.getByTitle('マリオ')
      fireEvent.click(card)

      expect(mockPush).toHaveBeenCalledWith('/memo/mario')
    })

    it('画像をクリックしても遷移する', () => {
      render(<CharacterCard character={sampleCharacter} />)

      const image = screen.getByAltText('マリオ')
      fireEvent.click(image)

      expect(mockPush).toHaveBeenCalledWith('/memo/mario')
    })

    it('プレースホルダーをクリックしても遷移する', () => {
      const characterWithoutIcon: Character = {
        id: 'luigi',
        name: 'ルイージ',
        icon: '',
        order: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(<CharacterCard character={characterWithoutIcon} />)

      const placeholder = screen.getByText('IMG')
      fireEvent.click(placeholder)

      expect(mockPush).toHaveBeenCalledWith('/memo/luigi')
    })
  })

  describe('アクセシビリティ', () => {
    const sampleCharacter: Character = {
      id: '1',
      name: 'マリオ',
      icon: 'mario.png'
    }

    it('適切なalt属性が設定されている', () => {
      render(<CharacterCard character={sampleCharacter} />)

      const image = screen.getByAltText('マリオ')
      expect(image).toHaveAttribute('alt', 'マリオ')
    })

    it('適切なtitle属性が設定されている', () => {
      render(<CharacterCard character={sampleCharacter} />)

      const card = screen.getByTitle('マリオ')
      expect(card).toHaveAttribute('title', 'マリオ')
    })

  })

  describe('エラーケース', () => {
    it('IDが空文字の場合も正常に動作する', () => {
      const characterWithEmptyId: Character = {
        id: '',
        name: 'テストキャラ',
        icon: 'test.png',
        order: 99,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(<CharacterCard character={characterWithEmptyId} />)

      const card = screen.getByTitle('テストキャラ')
      fireEvent.click(card)

      expect(mockPush).toHaveBeenCalledWith('/memo/')
    })

    it('名前が空文字の場合も正常に表示される', () => {
      const characterWithEmptyName: Character = {
        id: '1',
        name: '',
        icon: 'test.png',
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(<CharacterCard character={characterWithEmptyName} />)

      const image = screen.getByAltText('')
      expect(image).toBeInTheDocument()
    })
  })
})