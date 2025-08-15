/**
 * useMemoValidationフックのテスト
 * バリデーションロジックの正確性を確認
 */

import { renderHook } from '@testing-library/react'
import { useMemoValidation } from '@/app/(protected)/memo-settings/hooks/useMemoValidation'
import type { MemoItem } from '@/types'

describe('useMemoValidation', () => {
  // テスト用のサンプルデータ
  const sampleItems: MemoItem[] = [
    {
      id: '1',
      name: '既存項目1',
      order: 1,
      visible: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2', 
      name: '既存項目2',
      order: 2,
      visible: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  describe('newItemValidation - 新規項目のバリデーション', () => {
    it('空文字の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('項目名を入力してください')
    })

    it('空白のみの場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '   ',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('項目名を入力してください')
    })

    it('50文字を超える場合、エラーを返す', () => {
      const longName = 'a'.repeat(51) // 51文字
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: longName,
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('項目名は50文字以内で入力してください')
    })

    it('重複する名前の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '既存項目1', // 既存と同じ名前
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('この項目名は既に使用されています')
    })

    it('重複チェックで大文字小文字を区別しない', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '既存項目１', // 全角数字で微妙に違う
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })

    it('前後の空白を除去して重複チェックする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '  既存項目1  ', // 前後に空白
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('この項目名は既に使用されています')
    })

    it('有効な名前の場合、成功を返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '新しい項目',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })

    it('1文字の名前は有効', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: 'a',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })

    it('50文字ちょうどの名前は有効', () => {
      const exactName = 'a'.repeat(50) // 50文字
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: exactName,
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })
  })

  describe('editingValidation - 編集時のバリデーション', () => {
    it('編集対象が選択されていない場合、常に有効', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '', // 空でも
        editingId: null // 編集対象なし
      }))

      expect(result.current.editingValidation.isValid).toBe(true)
      expect(result.current.editingValidation.error).toBe('')
    })

    it('編集時に空文字の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '',
        editingId: '1' // 編集中
      }))

      expect(result.current.editingValidation.isValid).toBe(false)
      expect(result.current.editingValidation.error).toBe('項目名を入力してください')
    })

    it('編集時に50文字を超える場合、エラーを返す', () => {
      const longName = 'a'.repeat(51)
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: longName,
        editingId: '1'
      }))

      expect(result.current.editingValidation.isValid).toBe(false)
      expect(result.current.editingValidation.error).toBe('項目名は50文字以内で入力してください')
    })

    it('編集時に他の項目と重複する場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '既存項目2', // ID1を編集中に、ID2と同じ名前
        editingId: '1'
      }))

      expect(result.current.editingValidation.isValid).toBe(false)
      expect(result.current.editingValidation.error).toBe('この項目名は既に使用されています')
    })

    it('編集時に自分と同じ名前の場合、有効', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '既存項目1', // ID1を編集中に、同じ名前
        editingId: '1'
      }))

      expect(result.current.editingValidation.isValid).toBe(true)
      expect(result.current.editingValidation.error).toBe('')
    })

    it('編集時に有効な新しい名前の場合、成功を返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: '',
        editingName: '編集後の名前',
        editingId: '1'
      }))

      expect(result.current.editingValidation.isValid).toBe(true)
      expect(result.current.editingValidation.error).toBe('')
    })
  })

  describe('エッジケース', () => {
    it('項目リストが空の場合でも正常に動作する', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: [],
        newItemName: 'テスト項目',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })

    it('日本語を含む名前でも正常にバリデーションする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: 'テスト項目（日本語）',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })

    it('特殊文字を含む名前でも正常にバリデーションする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: sampleItems,
        newItemName: 'テスト-項目_123@#',
        editingName: '',
        editingId: null
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
      expect(result.current.newItemValidation.error).toBe('')
    })
  })
})