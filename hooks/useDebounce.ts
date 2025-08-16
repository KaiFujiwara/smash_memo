/**
 * useDebounceフック
 * 
 * 値の変更を指定した遅延時間後に反映させるフックです。
 * 連続した変更をまとめて処理する際に使用します。
 */

import { useState, useEffect } from 'react'

/**
 * 値をデバウンスするフック
 * 
 * @param value - デバウンスする値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}