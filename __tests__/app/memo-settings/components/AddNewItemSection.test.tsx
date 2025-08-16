/**
 * AddNewItemSectionコンポーネントのテスト
 * 新規メモ項目追加のUI動作を確認
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { AddNewItemSection } from '@/app/(protected)/memo-settings/components/AddNewItemSection'
import type { ValidationResult } from '@/app/(protected)/memo-settings/types'

describe('AddNewItemSection', () => {
  const mockOnNameChange = jest.fn()
  const mockOnAddItem = jest.fn()

  const defaultProps = {
    newItemName: '',
    itemsCount: 3,
    isAdding: false,
    validation: { isValid: true, error: '' } as ValidationResult,
    onNameChange: mockOnNameChange,
    onAddItem: mockOnAddItem
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本的な表示', () => {
    it('正常にレンダリングされる', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      expect(screen.getByText('新しいメモ項目を追加')).toBeInTheDocument()
      expect(screen.getByText('3 / 20 項目')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('例：立ち回り、コンボ')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
    })

    it('アイテム数が正しく表示される', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={15} />)
      
      expect(screen.getByText('15 / 20 項目')).toBeInTheDocument()
    })

    it('入力フィールドに値が表示される', () => {
      render(<AddNewItemSection {...defaultProps} newItemName="テスト項目" />)
      
      const input = screen.getByDisplayValue('テスト項目')
      expect(input).toBeInTheDocument()
    })

    it('文字数カウンターが正しく表示される', () => {
      render(<AddNewItemSection {...defaultProps} newItemName="テスト" />)
      
      expect(screen.getByText('3/50')).toBeInTheDocument()
    })
  })

  describe('入力操作', () => {
    it('入力時にonNameChangeが呼ばれる', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      fireEvent.change(input, { target: { value: '新しい項目' } })
      
      expect(mockOnNameChange).toHaveBeenCalledWith('新しい項目')
    })

    it('Enterキーで有効な場合に追加が実行される', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnAddItem).toHaveBeenCalled()
    })

    it('Enterキーで無効な場合は追加されない', () => {
      const invalidValidation = { isValid: false, error: 'エラー' }
      render(<AddNewItemSection {...defaultProps} validation={invalidValidation} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnAddItem).not.toHaveBeenCalled()
    })

    it('追加ボタンクリックでonAddItemが呼ばれる', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: '追加' })
      fireEvent.click(button)
      
      expect(mockOnAddItem).toHaveBeenCalled()
    })
  })

  describe('バリデーション表示', () => {
    it('バリデーションエラーが表示される', () => {
      const invalidValidation = { isValid: false, error: 'この項目名は既に使用されています' }
      render(<AddNewItemSection {...defaultProps} newItemName="重複項目" validation={invalidValidation} />)
      
      expect(screen.getByText('この項目名は既に使用されています')).toBeInTheDocument()
    })

    it('入力が空の場合はエラー表示されない', () => {
      const invalidValidation = { isValid: false, error: '項目名を入力してください' }
      render(<AddNewItemSection {...defaultProps} newItemName="" validation={invalidValidation} />)
      
      expect(screen.queryByText('項目名を入力してください')).not.toBeInTheDocument()
    })

  })

  describe('ボタンの状態', () => {
    it('有効な状態では追加ボタンが有効', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: '追加' })
      expect(button).not.toBeDisabled()
    })

    it('バリデーションエラー時は追加ボタンが無効', () => {
      const invalidValidation = { isValid: false, error: 'エラー' }
      render(<AddNewItemSection {...defaultProps} validation={invalidValidation} />)
      
      const button = screen.getByRole('button', { name: '追加' })
      expect(button).toBeDisabled()
    })

    it('追加中は追加ボタンが無効で読み込み表示', () => {
      render(<AddNewItemSection {...defaultProps} isAdding={true} />)
      
      const button = screen.getByRole('button', { name: '追加中...' })
      expect(button).toBeDisabled()
      expect(screen.getByText('追加中...')).toBeInTheDocument()
    })

    it('追加中はローディングスピナーが表示される', () => {
      render(<AddNewItemSection {...defaultProps} isAdding={true} />)
      
      const spinner = screen.getByRole('button').querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('最大アイテム数制限', () => {
    it('最大数に達した場合の警告表示', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={20} />)
      
      expect(screen.getByText('（上限達成）')).toBeInTheDocument()
    })

    it('最大数に達した場合は入力フィールドが無効', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={20} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      expect(input).toBeDisabled()
    })

    it('最大数に達した場合は追加ボタンが無効', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={20} />)
      
      const button = screen.getByRole('button', { name: '追加' })
      expect(button).toBeDisabled()
    })

    it('最大数に達した場合はEnterキーで追加されない', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={20} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockOnAddItem).not.toHaveBeenCalled()
    })

    it('最大数-1の場合は正常に動作する', () => {
      render(<AddNewItemSection {...defaultProps} itemsCount={19} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      const button = screen.getByRole('button', { name: '追加' })
      
      expect(input).not.toBeDisabled()
      expect(button).not.toBeDisabled()
      expect(screen.queryByText('（上限達成）')).not.toBeInTheDocument()
    })
  })

  describe('キーボードイベント', () => {
    it('他のキーでは追加されない', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      fireEvent.keyDown(input, { key: 'Space' })
      fireEvent.keyDown(input, { key: 'Tab' })
      fireEvent.keyDown(input, { key: 'Escape' })
      
      expect(mockOnAddItem).not.toHaveBeenCalled()
    })
  })

  describe('maxLength属性', () => {
    it('入力フィールドにmaxLength=50が設定されている', () => {
      render(<AddNewItemSection {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('例：立ち回り、コンボ')
      expect(input).toHaveAttribute('maxLength', '50')
    })
  })
})