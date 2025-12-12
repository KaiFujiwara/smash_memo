/**
 * useMemoValidationフックのテスト
 * バリデーションロジックの核心部分をテスト
 */

import { renderHook } from '@testing-library/react'
import { useMemoValidation } from '@/app/(protected)/memo-settings/hooks/useMemoValidation'
import type { MemoItem } from '@/types'

describe('useMemoValidation', () => {
  const mockMessages = {
    nameRequired: 'メモ項目名を入力してください',
    nameTooLong: 'メモ項目名は{max}文字以内で入力してください',
    nameDuplicate: 'この項目名は既に使用されています'
  }

  const mockItems: MemoItem[] = [
    { id: '1', name: 'コンボ', order: 1, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: '復帰阻止', order: 2, visible: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
  ]

  describe('新規項目のバリデーション', () => {
    it('空文字の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('メモ項目名を入力してください')
    })

    it('空白のみの場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '   ',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('メモ項目名を入力してください')
    })

    it('50文字以内の場合、有効とする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: 'a'.repeat(50),
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
    })

    it('51文字以上の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: 'a'.repeat(51),
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('メモ項目名は50文字以内で入力してください')
    })

    it('既存項目と重複する場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: 'コンボ',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('この項目名は既に使用されています')
    })

    it('大文字小文字を区別せず重複を検出する', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: 'コンボ',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
    })

    it('前後の空白を除いて重複を検出する', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '  コンボ  ',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(false)
      expect(result.current.newItemValidation.error).toBe('この項目名は既に使用されています')
    })

    it('前後に空白があっても有効な名前として扱う', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '  新しい項目  ',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
    })

    it('全角数字を含む名前も有効とする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '１２３',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.newItemValidation.isValid).toBe(true)
    })
  })

  describe('編集中項目のバリデーション', () => {
    it('編集中でない場合、常に有効とする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      expect(result.current.editingValidation.isValid).toBe(true)
    })

    it('自分自身と同じ名前の場合、有効とする', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: 'コンボ',
        editingId: '1',
        messages: mockMessages
      }))

      expect(result.current.editingValidation.isValid).toBe(true)
    })

    it('他の項目と重複する場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '復帰阻止',
        editingId: '1',
        messages: mockMessages
      }))

      expect(result.current.editingValidation.isValid).toBe(false)
      expect(result.current.editingValidation.error).toBe('この項目名は既に使用されています')
    })

    it('空文字の場合、エラーを返す', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '',
        editingId: '1',
        messages: mockMessages
      }))

      expect(result.current.editingValidation.isValid).toBe(false)
      expect(result.current.editingValidation.error).toBe('メモ項目名を入力してください')
    })
  })

  describe('validateItemName関数', () => {
    it('正しく動作する', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      const validation = result.current.validateItemName('新しい項目')
      expect(validation.isValid).toBe(true)
      expect(validation.error).toBe('')
    })

    it('excludeIdを指定した場合、その項目を除外する', () => {
      const { result } = renderHook(() => useMemoValidation({
        items: mockItems,
        newItemName: '',
        editingName: '',
        editingId: null,
        messages: mockMessages
      }))

      const validation = result.current.validateItemName('コンボ', '1')
      expect(validation.isValid).toBe(true)
    })
  })
})
