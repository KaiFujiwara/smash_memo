/**
 * 順序計算ロジックのテスト
 * メモ項目の order 値の計算ロジックをテスト
 */

import type { MemoItem } from '@/types'

describe('Order Calculation Logic', () => {
  describe('配列の順序再計算（ドラッグ&ドロップ時）', () => {
    it('ドラッグ後、1ベースの連続番号で順序を振り直す', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 5, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 10, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 15, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      // ドラッグ&ドロップのロジックをシミュレート
      const currentItems = Array.from(items).sort((a, b) => a.order - b.order)
      const sourceIndex = 0
      const destinationIndex = 2

      const [movedItem] = currentItems.splice(sourceIndex, 1)
      currentItems.splice(destinationIndex, 0, movedItem)

      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        order: index + 1 // 1ベースの順序
      }))

      expect(updatedItems[0].order).toBe(1)
      expect(updatedItems[1].order).toBe(2)
      expect(updatedItems[2].order).toBe(3)
      expect(updatedItems[2].id).toBe('1') // 最後に移動した
    })

    it('項目2を最初の位置に移動', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const currentItems = Array.from(items).sort((a, b) => a.order - b.order)
      const [movedItem] = currentItems.splice(1, 1)
      currentItems.splice(0, 0, movedItem)

      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        order: index + 1
      }))

      expect(updatedItems[0].id).toBe('2')
      expect(updatedItems[0].order).toBe(1)
      expect(updatedItems[1].id).toBe('1')
      expect(updatedItems[1].order).toBe(2)
    })

    it('最後の項目を最初に移動', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const currentItems = Array.from(items).sort((a, b) => a.order - b.order)
      const [movedItem] = currentItems.splice(2, 1)
      currentItems.splice(0, 0, movedItem)

      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        order: index + 1
      }))

      expect(updatedItems[0].id).toBe('3')
      expect(updatedItems[0].order).toBe(1)
      expect(updatedItems[2].order).toBe(3)
    })

    it('最初の項目を最後に移動', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const currentItems = Array.from(items).sort((a, b) => a.order - b.order)
      const [movedItem] = currentItems.splice(0, 1)
      currentItems.splice(2, 0, movedItem)

      const updatedItems = currentItems.map((item, index) => ({
        ...item,
        order: index + 1
      }))

      expect(updatedItems[2].id).toBe('1')
      expect(updatedItems[2].order).toBe(3)
      expect(updatedItems[0].id).toBe('2')
    })
  })

  describe('新規追加時の順序計算', () => {
    it('空の配列の場合、order=1を返す', () => {
      const items: MemoItem[] = []
      const maxOrder = Math.max(0, ...items.map(item => item.order))
      const nextOrder = maxOrder + 1

      expect(nextOrder).toBe(1)
    })

    it('既存項目がある場合、最大order+1を返す', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      const maxOrder = Math.max(0, ...items.map(item => item.order))
      const nextOrder = maxOrder + 1

      expect(nextOrder).toBe(3)
    })

    it('orderが不連続でも最大値+1を返す', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 5, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 10, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      const maxOrder = Math.max(0, ...items.map(item => item.order))
      const nextOrder = maxOrder + 1

      expect(nextOrder).toBe(11)
    })

    it('負のorderがあっても正しく計算する', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: -1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      const maxOrder = Math.max(0, ...items.map(item => item.order))
      const nextOrder = maxOrder + 1

      expect(nextOrder).toBe(1) // Math.max(0, ...) により最小値は0
    })
  })

  describe('配列のソート', () => {
    it('order値でソートする', () => {
      const items: MemoItem[] = [
        { id: '3', name: '項目3', order: 15, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '1', name: '項目1', order: 5, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 10, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const sorted = Array.from(items).sort((a, b) => a.order - b.order)

      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
      expect(sorted[2].id).toBe('3')
    })

    it('負のorderも正しくソートする', () => {
      const items: MemoItem[] = [
        { id: '1', name: '項目1', order: 5, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: -1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '項目3', order: 0, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const sorted = Array.from(items).sort((a, b) => a.order - b.order)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })
  })

  describe('配列の同一性チェック', () => {
    it('同じ内容の配列は同一とみなす', () => {
      const items1: MemoItem[] = [
        { id: '1', name: '項目1', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      const items2: MemoItem[] = [
        { id: '1', name: '項目1', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const areEqual = items1.length === items2.length &&
        items1.every((item, index) => {
          const item2 = items2[index]
          return item.id === item2.id &&
                 item.name === item2.name &&
                 item.order === item2.order
        })

      expect(areEqual).toBe(true)
    })

    it('順序が変わった配列は異なるとみなす', () => {
      const items1: MemoItem[] = [
        { id: '1', name: '項目1', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]
      const items2: MemoItem[] = [
        { id: '1', name: '項目1', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '項目2', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]

      const areEqual = items1.length === items2.length &&
        items1.every((item, index) => {
          const item2 = items2[index]
          return item.id === item2.id &&
                 item.name === item2.name &&
                 item.order === item2.order
        })

      expect(areEqual).toBe(false)
    })
  })
})
