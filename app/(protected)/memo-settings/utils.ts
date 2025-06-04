/**
 * メモ設定ページのユーティリティ関数
 */

import type { MemoItem } from '@/types'

/**
 * 2つの配列が同じ順序かどうかを判定
 */
export function areItemsEqual(items1: MemoItem[], items2: MemoItem[]): boolean {
  if (items1.length !== items2.length) return false
  
  return items1.every((item, index) => {
    const item2 = items2[index]
    return item.id === item2.id && 
           item.name === item2.name && 
           item.order === item2.order
  })
} 