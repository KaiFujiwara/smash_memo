/**
 * メモ項目サービスのテスト
 * 
 * 基本的な関数のexportと型チェックのテスト
 */

import {
  getMemoItems,
  createMemoItem,
  updateMemoItem,
  deleteMemoItem,
  bulkUpdateMemoItemOrder,
  getNextOrder
} from '@/services/memoItemService'

// GraphQL関数のモック
jest.mock('@aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn().mockResolvedValue({
      data: {
        listMemoItems: {
          items: []
        }
      }
    }),
  })),
}))

describe('memoItemService', () => {
  
  describe('関数のエクスポート確認', () => {
    it('getMemoItems関数がエクスポートされている', () => {
      expect(typeof getMemoItems).toBe('function')
    })

    it('createMemoItem関数がエクスポートされている', () => {
      expect(typeof createMemoItem).toBe('function')
    })

    it('updateMemoItem関数がエクスポートされている', () => {
      expect(typeof updateMemoItem).toBe('function')
    })

    it('deleteMemoItem関数がエクスポートされている', () => {
      expect(typeof deleteMemoItem).toBe('function')
    })

    it('bulkUpdateMemoItemOrder関数がエクスポートされている', () => {
      expect(typeof bulkUpdateMemoItemOrder).toBe('function')
    })

    it('getNextOrder関数がエクスポートされている', () => {
      expect(typeof getNextOrder).toBe('function')
    })
  })

  describe('型安全性テスト', () => {
    it('getMemoItemsは適切な戻り値の型を持つ', async () => {
      const result = await getMemoItems()
      expect(typeof result).toBe('object')
      expect(Array.isArray(result.items)).toBe(true)
    })

    it('createMemoItemはバリデーションエラーを適切に処理する', async () => {
      const result = await createMemoItem({ name: '', order: 0, visible: true })
      expect(result.success).toBe(false)
      expect(typeof result.error).toBe('string')
    })

    it('getNextOrderは数値を返す', async () => {
      const result = await getNextOrder()
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })
}) 