/**
 * 未保存変更の検知と離脱警告フック
 */

import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { MemoItem } from '@/types'
import type { MemoSettingsState, PendingNavigation } from '../types'
import { areItemsEqual } from '../utils'

interface UseUnsavedChangesProps {
  items: MemoItem[]
  forceUpdateCounter: number
  updateState: (updates: Partial<MemoSettingsState>) => void
}

export function useUnsavedChanges({
  items,
  forceUpdateCounter,
  updateState
}: UseUnsavedChangesProps) {
  const router = useRouter()
  const initialItemsRef = useRef<MemoItem[]>([])
  const hasUnsavedChangesRef = useRef(false)
  const isNavigatingRef = useRef(false)

  // 変更検知
  const hasUnsavedChanges = useMemo(() => {
    // 初期データがまだ設定されていない場合は変更なしとする
    if (initialItemsRef.current.length === 0) {
      return false
    }
    
    const result = !areItemsEqual(items, initialItemsRef.current)
    console.log('🔍 変更検知:', { 
      hasChanges: result, 
      currentItems: items.length, 
      initialItems: initialItemsRef.current.length
    })
    return result
  }, [items, forceUpdateCounter])

  // 変更検知の状態更新
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  // 離脱先情報を保存する関数
  const savePendingNavigation = useCallback((navigation: PendingNavigation) => {
    console.log('📍 離脱先情報を保存:', navigation)
    updateState({ pendingNavigation: navigation })
  }, [updateState])

  // アプリ内離脱警告
  useEffect(() => {
    // 初期履歴エントリを追加
    window.history.pushState(null, '', window.location.href)
    
    // ブラウザ戻るボタンの処理
    const handlePopState = (e: PopStateEvent) => {
      console.log('📱 popstate イベント発火')
      
      if (hasUnsavedChangesRef.current && !isNavigatingRef.current) {
        console.log('⚠️ ブラウザ戻る警告を表示')
        e.preventDefault()
        window.history.pushState(null, '', window.location.href)
        
        // 戻る動作の情報を保存
        savePendingNavigation({
          type: 'back',
          timestamp: Date.now()
        })
        
        updateState({ showUnsavedWarning: true })
      }
    }

    // リンククリック時の離脱警告
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && hasUnsavedChangesRef.current && !isNavigatingRef.current) {
        try {
          const url = new URL(link.href)
          if (url.origin === window.location.origin) {
            console.log('🔗 リンククリック離脱警告:', link.href)
            e.preventDefault()
            e.stopPropagation()
            
            // リンク先の情報を保存
            savePendingNavigation({
              type: 'link',
              url: link.href,
              timestamp: Date.now()
            })
            
            updateState({ showUnsavedWarning: true })
          }
        } catch (error) {
          console.log('🔗 URL解析エラー:', error)
        }
      }
    }

    // ページリロード・タブ閉じる警告
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && !isNavigatingRef.current) {
        console.log('⚠️ ページ離脱警告（beforeunload）')
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    // イベントリスナーを登録
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleLinkClick, true)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleLinkClick, true)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [updateState, savePendingNavigation])

  // 初期状態をリセットする関数
  const resetInitialState = useCallback((newItems: MemoItem[]) => {
    console.log('🔄 初期状態をリセット:', newItems.length, '項目')
    initialItemsRef.current = [...newItems]
    hasUnsavedChangesRef.current = false
  }, [])

  // 強制離脱フラグ設定
  const setNavigating = useCallback((navigating: boolean) => {
    console.log('🚦 離脱フラグ設定:', navigating)
    isNavigatingRef.current = navigating
  }, [])

  return {
    hasUnsavedChanges,
    hasUnsavedChangesRef,
    isNavigatingRef,
    initialItemsRef,
    resetInitialState,
    setNavigating
  }
} 