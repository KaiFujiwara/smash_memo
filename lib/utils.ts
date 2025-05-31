/**
 * ユーティリティ関数
 * 
 * アプリケーション全体で使用される汎用的なヘルパー関数を定義します。
 * 主にTailwind CSSのクラス名の結合や条件付きスタイリングに使用されます。
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSSクラス名を結合するユーティリティ関数
 * 
 * この関数は以下の機能を提供します：
 * 1. clsx: 条件付きクラス名の結合
 * 2. twMerge: Tailwindクラスの競合解決と最適化
 * 
 * 使用例:
 * ```typescript
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': isActive })
 * // → 'px-4 py-2 bg-blue-500 text-white' (isActiveがtrueの場合)
 * 
 * cn('p-4', 'px-6') 
 * // → 'p-4 px-6' ではなく 'py-4 px-6' (twMergeによる最適化)
 * ```
 * 
 * @param inputs - 結合するクラス名（文字列、オブジェクト、配列など）
 * @returns 結合・最適化されたクラス名文字列
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}