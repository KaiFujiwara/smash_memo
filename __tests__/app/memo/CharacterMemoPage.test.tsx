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

  describe('デバウンス保存機能', () => {
    it('入力後500msで保存が実行される', async () => {
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
      
      // テキストを入力
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '新しいメモ内容' } })
      })

      // デバウンス前は保存されていない
      expect(upsertMemoContent).not.toHaveBeenCalled()

      // 500ms進める
      await act(async () => {
        jest.advanceTimersByTime(500)
      })

      // 保存が実行される
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '新しいメモ内容',
          { keepalive: false }
        )
      })
    })

    it('連続入力時は最後の入力から500ms後に保存される', async () => {
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
      
      // 1回目の入力
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '入力1' } })
      })

      // 300ms待つ
      await act(async () => {
        jest.advanceTimersByTime(300)
      })

      // まだ保存されていない
      expect(upsertMemoContent).not.toHaveBeenCalled()

      // 2回目の入力（タイマーリセット）
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '入力2' } })
      })

      // さらに500ms待つ
      await act(async () => {
        jest.advanceTimersByTime(500)
      })

      // 最後の入力内容で保存される
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledTimes(1)
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '入力2',
          { keepalive: false }
        )
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
    it('保存成功時は静かに自動保存される（トーストなし）', async () => {
      
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
      
      // デバウンス時間を待つ（500ms）
      await act(async () => {
        jest.advanceTimersByTime(500)
      })

      // 保存処理の完了を待つ
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '更新内容',
          { keepalive: false }
        )
      })

      // 成功時はトーストが表示されないことを確認
      expect(toast.success).not.toHaveBeenCalled()
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
      
      // 保存失敗を設定（ここで設定しないと初期化時の成功モックが使われる）
      ;(upsertMemoContent as jest.Mock).mockImplementation(() => Promise.reject(new Error('保存エラー')))
      
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '更新内容' } })
      })
      
      // デバウンス時間を待つ（500ms）
      await act(async () => {
        jest.advanceTimersByTime(500)
      })

      // エラー処理の完了を待つ
      await waitFor(() => {
        expect(upsertMemoContent).toHaveBeenCalledWith(
          'test-character-id',
          'item-1',
          '更新内容',
          { keepalive: false }
        )
      })

      // Promiseのエラーが処理されるまで待つ
      await act(async () => {
        await Promise.resolve()
      })

      // エラートーストの表示を確認
      expect(toast.error).toHaveBeenCalledWith('メモの保存に失敗しました')
    })
  })
})