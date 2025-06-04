/**
 * 未保存変更検知の共通フック
 * 任意のデータ配列の変更を検知し、ページ離脱時の警告を管理
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PendingNavigation {
  type: 'link' | 'back' | 'external'
  url?: string
  timestamp: number
}

interface UseUnsavedChangesProps<T> {
  items: T[]
  forceUpdateCounter?: number
  updateState: (updates: { showUnsavedWarning?: boolean; pendingNavigation?: PendingNavigation | null }) => void
}

export function useUnsavedChanges<T>({
  items,
  forceUpdateCounter = 0,
  updateState
}: UseUnsavedChangesProps<T>) {
  const [initialItems, setInitialItems] = useState<T[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const hasSetInitial = useRef(false)

  // 初期状態をリセット
  const resetInitialState = useCallback((newItems: T[]) => {
    setInitialItems(newItems)
    hasSetInitial.current = true
  }, [])

  // 変更があるかどうかを判定
  const hasUnsavedChanges = JSON.stringify(items) !== JSON.stringify(initialItems) && hasSetInitial.current

  // ブラウザの戻るボタンやタブクローズを検知
  useEffect(() => {
    if (isNavigating) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    function handlePopState() {
      if (hasUnsavedChanges) {
        window.history.pushState(null, '', window.location.href)
        updateState({ 
          showUnsavedWarning: true,
          pendingNavigation: { type: 'back', timestamp: Date.now() }
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges, isNavigating, updateState])

  // リンククリックを検知
  useEffect(() => {
    if (isNavigating) return

    function handleLinkClick(e: MouseEvent) {
      if (!hasUnsavedChanges) return

      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (link && link.href && !link.href.startsWith('javascript:')) {
        // 外部リンクかどうかチェック
        const isExternal = link.hostname !== window.location.hostname
        const isNewTab = link.target === '_blank' || e.ctrlKey || e.metaKey
        
        if (!isExternal && !isNewTab) {
          e.preventDefault()
          updateState({ 
            showUnsavedWarning: true,
            pendingNavigation: { 
              type: 'link', 
              url: link.href,
              timestamp: Date.now()
            }
          })
        }
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    return () => document.removeEventListener('click', handleLinkClick, true)
  }, [hasUnsavedChanges, isNavigating, updateState])

  return {
    hasUnsavedChanges,
    resetInitialState,
    setNavigating: setIsNavigating
  }
} 