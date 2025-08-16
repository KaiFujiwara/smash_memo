/**
 * MemoItemコンポーネントのテスト
 * 個別メモ項目の表示、編集、削除機能のテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { MemoItem } from '@/app/(protected)/memo-settings/components/MemoItem'
import type { MemoItem as MemoItemType } from '@/types'
import type { ValidationResult } from '@/app/(protected)/memo-settings/types'
import { MAX_ITEM_NAME_LENGTH } from '@/app/(protected)/memo-settings/types'

// テスト用のラッパーコンポーネント（ドラッグ&ドロップコンテキストを提供）
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test-droppable">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

describe('MemoItem', () => {
  const mockItem: MemoItemType = {
    id: '1',
    name: 'テスト項目',
    order: 0,
    visible: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }

  const defaultProps = {
    item: mockItem,
    index: 0,
    isEditing: false,
    editingName: '',
    editingValidation: { isValid: true, error: null } as ValidationResult,
    isDragging: false,
    onStartEditing: jest.fn(),
    onSaveEdit: jest.fn(),
    onCancelEdit: jest.fn(),
    onEditingNameChange: jest.fn(),
    onDeleteConfirm: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('通常表示', () => {
    it('項目名が正しく表示される', () => {
      render(
        <TestWrapper>
          <MemoItem {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('テスト項目')).toBeInTheDocument()
    })

    it('ドラッグハンドルが表示される', () => {
      render(
        <TestWrapper>
          <MemoItem {...defaultProps} />
        </TestWrapper>
      )

      const dragHandle = screen.getByTitle('ドラッグして並び替え')
      expect(dragHandle).toBeInTheDocument()
    })

    it('編集ボタンをクリックすると編集開始コールバックが呼ばれる', () => {
      render(
        <TestWrapper>
          <MemoItem {...defaultProps} />
        </TestWrapper>
      )

      const editButton = screen.getByTitle('編集')
      fireEvent.click(editButton)

      expect(defaultProps.onStartEditing).toHaveBeenCalledWith(mockItem)
    })

    it('削除ボタンをクリックすると削除確認コールバックが呼ばれる', () => {
      render(
        <TestWrapper>
          <MemoItem {...defaultProps} />
        </TestWrapper>
      )

      const deleteButton = screen.getByTitle('削除')
      fireEvent.click(deleteButton)

      expect(defaultProps.onDeleteConfirm).toHaveBeenCalledWith(mockItem)
    })

  })

  describe('編集モード', () => {
    const editingProps = {
      ...defaultProps,
      isEditing: true,
      editingName: '編集中の名前',
    }

    it('編集フィールドが表示される', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('編集中の名前')
    })

    it('文字数カウンターが表示される', () => {
      const { container } = render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      // カウンターが存在することを確認（divのクラス名で検索）
      const counterDiv = container.querySelector('.absolute.right-2.top-1\\/2.-translate-y-1\\/2.text-xs.text-gray-400')
      expect(counterDiv).toBeInTheDocument()
      expect(counterDiv?.textContent).toBe(`6/${MAX_ITEM_NAME_LENGTH}`) // "編集中の名前" は6文字
    })

    it('入力値が変更されるとコールバックが呼ばれる', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '新しい名前' } })

      expect(defaultProps.onEditingNameChange).toHaveBeenCalledWith('新しい名前')
    })

    it('Enterキーで保存される（バリデーションOKの場合）', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(defaultProps.onSaveEdit).toHaveBeenCalled()
    })

    it('Enterキーで保存されない（バリデーションNGの場合）', () => {
      const invalidProps = {
        ...editingProps,
        editingValidation: { isValid: false, error: 'エラー' },
      }

      render(
        <TestWrapper>
          <MemoItem {...invalidProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(defaultProps.onSaveEdit).not.toHaveBeenCalled()
    })

    it('Escapeキーでキャンセルされる', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Escape' })

      expect(defaultProps.onCancelEdit).toHaveBeenCalled()
    })

    it('保存ボタンが表示される', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const saveButton = screen.getByTitle('保存 (Enter)')
      expect(saveButton).toBeInTheDocument()
    })

    it('キャンセルボタンが表示される', () => {
      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const cancelButton = screen.getByTitle('キャンセル (Escape)')
      expect(cancelButton).toBeInTheDocument()
    })


    it('バリデーションエラーが表示される', () => {
      const invalidProps = {
        ...editingProps,
        editingName: 'エラー名',
        editingValidation: { isValid: false, error: '項目名が重複しています' },
      }

      render(
        <TestWrapper>
          <MemoItem {...invalidProps} />
        </TestWrapper>
      )

      expect(screen.getByText('項目名が重複しています')).toBeInTheDocument()
    })

    it('バリデーションエラー時は入力フィールドのスタイルが変わる', () => {
      const invalidProps = {
        ...editingProps,
        editingName: 'エラー名',
        editingValidation: { isValid: false, error: 'エラー' },
      }

      render(
        <TestWrapper>
          <MemoItem {...invalidProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('保存ボタンがバリデーションエラー時に無効化される', () => {
      const invalidProps = {
        ...editingProps,
        editingValidation: { isValid: false, error: 'エラー' },
      }

      render(
        <TestWrapper>
          <MemoItem {...invalidProps} />
        </TestWrapper>
      )

      const saveButton = screen.getByTitle('保存 (Enter)')
      expect(saveButton).toBeDisabled()
    })
  })


  describe('maxLength属性', () => {
    it('入力フィールドにmaxLength属性が設定される', () => {
      const editingProps = {
        ...defaultProps,
        isEditing: true,
        editingName: '',
      }

      render(
        <TestWrapper>
          <MemoItem {...editingProps} />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxLength', MAX_ITEM_NAME_LENGTH.toString())
    })
  })

  // autoFocusは削除されたためテストも削除
})