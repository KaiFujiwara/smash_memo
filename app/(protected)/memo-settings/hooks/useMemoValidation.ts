/**
 * メモ項目のバリデーション関連フック
 */

import { useCallback, useMemo } from 'react'
import type { MemoItem } from '@/types'
import type { ValidationResult } from '../types'
import { MAX_ITEM_NAME_LENGTH, MIN_ITEM_NAME_LENGTH } from '../types'

interface UseMemoValidationProps {
  items: MemoItem[]
  newItemName: string
  editingName: string
  editingId: string | null
}

export function useMemoValidation({
  items,
  newItemName,
  editingName,
  editingId
}: UseMemoValidationProps) {
  const isDuplicateName = useCallback((name: string, excludeId?: string) => {
    return items.some(item => 
      item.id !== excludeId && 
      item.name.toLowerCase().trim() === name.toLowerCase().trim()
    )
  }, [items])

  const validateItemName = useCallback((name: string, excludeId?: string): ValidationResult => {
    const trimmedName = name.trim()
    
    if (trimmedName.length < MIN_ITEM_NAME_LENGTH) {
      return { isValid: false, error: '項目名を入力してください' }
    }
    
    if (trimmedName.length > MAX_ITEM_NAME_LENGTH) {
      return { isValid: false, error: `項目名は${MAX_ITEM_NAME_LENGTH}文字以内で入力してください` }
    }
    
    if (isDuplicateName(trimmedName, excludeId)) {
      return { isValid: false, error: 'この項目名は既に存在します' }
    }
    
    return { isValid: true, error: null }
  }, [isDuplicateName])

  const newItemValidation = useMemo(() => 
    validateItemName(newItemName), 
    [newItemName, validateItemName]
  )

  const editingValidation = useMemo(() => 
    editingId ? validateItemName(editingName, editingId) : { isValid: true, error: null },
    [editingName, editingId, validateItemName]
  )

  return {
    newItemValidation,
    editingValidation,
    validateItemName
  }
} 