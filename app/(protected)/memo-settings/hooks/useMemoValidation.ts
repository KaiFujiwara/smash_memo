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
  messages: {
    nameRequired: string
    nameTooLong: string
    nameDuplicate: string
  }
}

export function useMemoValidation({
  items,
  newItemName,
  editingName,
  editingId,
  messages
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
      return { isValid: false, error: messages.nameRequired }
    }
    
    if (trimmedName.length > MAX_ITEM_NAME_LENGTH) {
      return { isValid: false, error: messages.nameTooLong.replace('{max}', MAX_ITEM_NAME_LENGTH.toString()) }
    }
    
    if (isDuplicateName(trimmedName, excludeId)) {
      return { isValid: false, error: messages.nameDuplicate }
    }
    
    return { isValid: true, error: '' }
  }, [isDuplicateName])

  const newItemValidation = useMemo(() => 
    validateItemName(newItemName), 
    [newItemName, validateItemName]
  )

  const editingValidation = useMemo(() => 
    editingId ? validateItemName(editingName, editingId) : { isValid: true, error: '' },
    [editingName, editingId, validateItemName]
  )

  return {
    newItemValidation,
    editingValidation,
    validateItemName
  }
} 