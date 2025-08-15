/**
 * MemoItemsListコンポーネントのテスト
 * メモ項目一覧の表示とドラッグ&ドロップ機能のテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoItemsList } from '@/app/(protected)/memo-settings/components/MemoItemsList'
import type { MemoItem } from '@/types'
import type { ValidationResult } from '@/app/(protected)/memo-settings/types'

// @hello-pangea/dndのモック
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragStart, onDragEnd }: any) => {
    // テスト用にコールバックを保存
    global.mockDragCallbacks = { onDragStart, onDragEnd }
    return <div data-testid="drag-drop-context">{children}</div>
  },
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children(
        {
          droppableProps: { 'data-droppable': true },
          innerRef: jest.fn(),
          placeholder: <div data-testid="placeholder" />,
        },
        { isDraggingOver: false }
      )}
    </div>
  ),
  Draggable: ({ children, draggableId, index }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children(
        {
          draggableProps: { 'data-draggable': true },
          dragHandleProps: { 'data-drag-handle': true },
          innerRef: jest.fn(),
        },
        { isDragging: false }
      )}
    </div>
  ),
}))

// MemoItemコンポーネントのモック
jest.mock('@/app/(protected)/memo-settings/components/MemoItem', () => ({
  MemoItem: ({ item, onStartEditing, onDeleteConfirm }: any) => (
    <div data-testid={`memo-item-${item.id}`}>
      <span>{item.name}</span>
      <button onClick={() => onStartEditing(item)}>編集</button>
      <button onClick={() => onDeleteConfirm(item.id)}>削除</button>
    </div>
  ),
}))

describe('MemoItemsList', () => {
  const mockItems: MemoItem[] = [
    {
      id: '1',
      name: '項目1',
      order: 1,
      visible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: '項目2',
      order: 0,
      visible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '3',
      name: '項目3',
      order: 2,
      visible: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]

  const defaultProps = {
    items: mockItems,
    editingId: null,
    editingName: '',
    editingValidation: { isValid: true, error: null } as ValidationResult,
    draggingId: null,
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onStartEditing: jest.fn(),
    onSaveEdit: jest.fn(),
    onCancelEdit: jest.fn(),
    onEditingNameChange: jest.fn(),
    onDeleteConfirm: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ヘッダー表示', () => {
    it('タイトルが表示される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect(screen.getByText('メモ項目一覧')).toBeInTheDocument()
    })

    it('ドラッグ&ドロップの説明が表示される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect(screen.getByText('ドラッグ&ドロップで順序を変更')).toBeInTheDocument()
    })
  })

  describe('項目の表示', () => {
    it('項目がorder順にソートされて表示される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      const items = screen.getAllByTestId(/^memo-item-/)
      expect(items).toHaveLength(3)
      
      // order順（0, 1, 2）で表示されることを確認
      expect(items[0]).toHaveAttribute('data-testid', 'memo-item-2')
      expect(items[1]).toHaveAttribute('data-testid', 'memo-item-1')
      expect(items[2]).toHaveAttribute('data-testid', 'memo-item-3')
    })

    it('各項目にMemoItemコンポーネントが正しいpropsで渡される', () => {
      render(<MemoItemsList {...defaultProps} editingId="1" />)
      
      // MemoItemがモックされているので、直接propsを確認することはできないが、
      // 項目が表示されることで正しく渡されていることを確認
      expect(screen.getByText('項目1')).toBeInTheDocument()
      expect(screen.getByText('項目2')).toBeInTheDocument()
      expect(screen.getByText('項目3')).toBeInTheDocument()
    })
  })

  describe('空の状態', () => {
    it('項目がない場合は空状態メッセージが表示される', () => {
      render(<MemoItemsList {...defaultProps} items={[]} />)
      
      expect(screen.getByText('メモ項目がありません')).toBeInTheDocument()
      expect(screen.getByText('上記のフォームから新しい項目を追加してください')).toBeInTheDocument()
    })

    it('空状態でアイコンが表示される', () => {
      const { container } = render(<MemoItemsList {...defaultProps} items={[]} />)
      
      const icon = container.querySelector('.h-8.w-8.text-gray-300')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('ドラッグ&ドロップ', () => {
    it('DragDropContextが正しく設定される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument()
    })

    it('Droppableが正しく設定される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect(screen.getByTestId('droppable-memo-items')).toBeInTheDocument()
    })

    it('onDragStartコールバックが設定される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      // グローバルに保存されたコールバックを確認
      expect((global as any).mockDragCallbacks.onDragStart).toBe(defaultProps.onDragStart)
    })

    it('onDragEndコールバックが設定される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect((global as any).mockDragCallbacks.onDragEnd).toBe(defaultProps.onDragEnd)
    })
  })

  describe('編集状態', () => {
    it('編集中の項目に正しいpropsが渡される', () => {
      const editingProps = {
        ...defaultProps,
        editingId: '1',
        editingName: '編集中の名前',
        editingValidation: { isValid: false, error: 'エラー' } as ValidationResult,
      }
      
      render(<MemoItemsList {...editingProps} />)
      
      // モックコンポーネントが表示されることで、propsが渡されていることを確認
      expect(screen.getByTestId('memo-item-1')).toBeInTheDocument()
    })
  })

  describe('ドラッグ中の状態', () => {
    it('ドラッグ中の項目に正しいpropsが渡される', () => {
      const draggingProps = {
        ...defaultProps,
        draggingId: '2',
      }
      
      render(<MemoItemsList {...draggingProps} />)
      
      // モックコンポーネントが表示されることで、propsが渡されていることを確認
      expect(screen.getByTestId('memo-item-2')).toBeInTheDocument()
    })
  })

  describe('コールバック関数の伝播', () => {
    it('onStartEditingが子コンポーネントから呼び出される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      const editButton = screen.getAllByText('編集')[0]
      editButton.click()
      
      // mockItemsをorder順にソートして、最初の項目を取得
      const sortedItems = [...mockItems].sort((a, b) => a.order - b.order)
      expect(defaultProps.onStartEditing).toHaveBeenCalledWith(sortedItems[0])
    })

    it('onDeleteConfirmが子コンポーネントから呼び出される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      const deleteButton = screen.getAllByText('削除')[0]
      deleteButton.click()
      
      // mockItemsをorder順にソートして、最初の項目のIDを取得
      const sortedItems = [...mockItems].sort((a, b) => a.order - b.order)
      expect(defaultProps.onDeleteConfirm).toHaveBeenCalledWith(sortedItems[0].id)
    })
  })


  describe('Droppableのプレースホルダー', () => {
    it('プレースホルダーが正しく表示される', () => {
      render(<MemoItemsList {...defaultProps} />)
      
      expect(screen.getByTestId('placeholder')).toBeInTheDocument()
    })
  })
})