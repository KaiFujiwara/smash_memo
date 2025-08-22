import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import CharacterMemoPage from '@/app/(protected)/memo/[characterId]/page'
import { fetchCharacter } from '@/services/characterService'
import { getMemoItems } from '@/services/memoItemService'
import { getMemoContentsByCharacter, upsertMemoContent } from '@/services/memoContentService'
import { useParams, useRouter } from 'next/navigation'
import { useHeader } from '@/contexts/headerContext'
import { toast } from 'sonner'

// モック
jest.mock('next/navigation')
jest.mock('@/services/characterService')
jest.mock('@/services/memoItemService')
jest.mock('@/services/memoContentService')
jest.mock('@/contexts/headerContext')
jest.mock('sonner')

// タイマーのモック
jest.useFakeTimers()

describe('CharacterMemoPage', () => {
  const mockPush = jest.fn()
  const mockSetCharacterName = jest.fn()
  const mockSetCharacterIcon = jest.fn()

  const mockCharacter = {
    id: 'test-character-id',
    name: 'テストキャラクター',
    icon: 'test-icon.png',
    categoryId: 'category-1',
    categoryName: 'カテゴリー1'
  }

  const mockMemoItems = [
    {
      id: 'item-1',
      name: 'コンボ',
      order: 1,
      visible: true
    },
    {
      id: 'item-2', 
      name: '立ち回り',
      order: 2,
      visible: true
    }
  ]

  const mockMemoContents = [
    {
      id: 'content-1',
      characterId: 'test-character-id',
      memoItemId: 'item-1',
      content: '既存のメモ内容'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    
    // ルーター関連のモック
    ;(useParams as jest.Mock).mockReturnValue({ characterId: 'test-character-id' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useHeader as jest.Mock).mockReturnValue({
      setCharacterName: mockSetCharacterName,
      setCharacterIcon: mockSetCharacterIcon
    })

    // サービス関数のデフォルトモック - 全てのテストで初期状態では成功するように設定
    ;(fetchCharacter as jest.Mock).mockResolvedValue(mockCharacter)
    ;(getMemoItems as jest.Mock).mockResolvedValue({ items: mockMemoItems })
    ;(getMemoContentsByCharacter as jest.Mock).mockResolvedValue(mockMemoContents)
    ;(upsertMemoContent as jest.Mock).mockImplementation(() => Promise.resolve(undefined))
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('手動保存機能', () => {
    it('変更あり時に保存ボタンと未保存マークが表示される', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      // データ読み込み完了を待つ
      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      // メモエリアをクリックして編集モードに
      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      // textarea要素を取得
      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      // 最初はボタンやマークが表示されていない
      expect(screen.queryByTitle('保存')).not.toBeInTheDocument()
      expect(screen.queryByText('未保存')).not.toBeInTheDocument()
      
      // テキストを入力
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '新しいメモ内容' } })
      })

      // 保存ボタンと未保存マークが表示される
      await waitFor(() => {
        expect(screen.getByTitle('保存')).toBeInTheDocument()
        expect(screen.getByText('未保存')).toBeInTheDocument()
      })
    })

    it('保存ボタンをクリックで保存される', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      // 編集モードに
      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      // テキスト変更
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '新しいメモ内容' } })
      })

      // 保存ボタンをクリック
      const saveButton = await screen.findByTitle('保存')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      // 保存が実行される
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '新しいメモ内容'
        )
      })
    })

    it('編集中でなくても変更があれば保存ボタンが表示される', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      // 編集モードにしてテキスト変更
      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '新しいメモ内容' } })
      })

      // 編集モードを終了（onBlur）
      await act(async () => {
        fireEvent.blur(textarea)
      })

      // 編集モードが終了しても、変更があるので保存ボタンと未保存マークが表示される
      await waitFor(() => {
        expect(screen.getByTitle('保存')).toBeInTheDocument()
        expect(screen.getByText('未保存')).toBeInTheDocument()
      })
    })
  })

  describe('編集状態の管理', () => {
    it('メモエリアクリックで編集モードになる', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      // 最初はtextareaが表示されていない
      expect(screen.queryByPlaceholderText('メモを入力してください...')).not.toBeInTheDocument()

      // メモエリアをクリック
      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      // textareaが表示される
      expect(await screen.findByPlaceholderText('メモを入力してください...')).toBeInTheDocument()
    })

    it('onBlurで編集モードが終了する', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      // 編集モードに
      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      // フォーカスを外す
      await act(async () => {
        fireEvent.blur(textarea)
      })

      // textareaが非表示になる
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('メモを入力してください...')).not.toBeInTheDocument()
      })
    })
  })

  describe('初期データ読み込み', () => {
    it('キャラクター情報とメモ項目を正しく表示する', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
        expect(screen.getByText('立ち回り')).toBeInTheDocument()
        expect(screen.getByText('既存のメモ内容')).toBeInTheDocument()
      })

      // ヘッダー情報の設定
      expect(mockSetCharacterName).toHaveBeenCalledWith('テストキャラクター')
      expect(mockSetCharacterIcon).toHaveBeenCalledWith('test-icon.png')
    })

    it('キャラクターが見つからない場合はリダイレクトする', async () => {
      ;(fetchCharacter as jest.Mock).mockResolvedValue(null)

      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/character-list')
        expect(toast.error).toHaveBeenCalledWith('キャラクターが見つかりません')
      })
    })

    it('メモ項目がない場合は案内を表示する', async () => {
      ;(getMemoItems as jest.Mock).mockResolvedValue({ items: [] })

      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('メモ項目がまだ設定されていません')).toBeInTheDocument()
      })
    })
  })

  describe('保存成功・失敗の処理', () => {
    it('保存成功時に成功トーストを表示する', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '更新内容' } })
      })

      // 保存ボタンをクリック
      const saveButton = await screen.findByTitle('保存')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      // 保存処理の完了を待つ
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '更新内容'
        )
      })

      // 成功トーストの表示を確認
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('メモを保存しました')
      })
    })

    it('保存失敗時にエラートーストを表示する', async () => {
      await act(async () => {
        render(<CharacterMemoPage />)
      })

      await waitFor(() => {
        expect(screen.getByText('コンボ')).toBeInTheDocument()
      })

      const memoArea = screen.getAllByText('既存のメモ内容')[0].parentElement
      await act(async () => {
        fireEvent.click(memoArea!)
      })

      const textarea = await screen.findByPlaceholderText('メモを入力してください...')
      
      // 保存失敗を設定
      ;(upsertMemoContent as jest.Mock).mockImplementation(() => Promise.reject(new Error('保存エラー')))
      
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '更新内容' } })
      })

      // 保存ボタンをクリック
      const saveButton = await screen.findByTitle('保存')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      // エラー処理の完了を待つ
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '更新内容'
        )
      })

      // エラートーストの表示を確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('メモの保存に失敗しました')
      })
    })
  })
})