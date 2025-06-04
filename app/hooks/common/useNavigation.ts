/**
 * ナビゲーション処理の共通フック
 * 任意のページで使用可能なナビゲーション制御
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PendingNavigation {
  type: 'link' | 'back' | 'external'
  url?: string
  timestamp: number
}

interface UseNavigationProps {
  setNavigating: (navigating: boolean) => void
  updateState: (updates: { showUnsavedWarning?: boolean }) => void
  onSave?: () => Promise<void>
}

export function useNavigation({
  setNavigating,
  updateState,
  onSave
}: UseNavigationProps) {
  const router = useRouter()

  // 離脱先に適切にナビゲーションする関数
  const executeNavigation = useCallback((pendingNavigation: PendingNavigation | null) => {
    if (!pendingNavigation) {
      router.back()
      return
    }

    switch (pendingNavigation.type) {
      case 'back':
        router.back()
        break
      case 'link':
        if (pendingNavigation.url) {
          router.push(pendingNavigation.url)
        } else {
          router.back()
        }
        break
      default:
        router.back()
        break
    }
  }, [router])

  // 強制離脱処理
  const handleForceLeave = useCallback((pendingNavigation: PendingNavigation | null) => {
    setNavigating(true)
    updateState({ showUnsavedWarning: false })
    executeNavigation(pendingNavigation)
  }, [executeNavigation, setNavigating, updateState])

  // 保存して離脱処理
  const handleSaveAndLeave = useCallback(async (pendingNavigation: PendingNavigation | null) => {
    if (!onSave) {
      handleForceLeave(pendingNavigation)
      return
    }

    try {
      setNavigating(true)
      await onSave()
      updateState({ showUnsavedWarning: false })
      
      // モーダルアニメーションを待つ
      setTimeout(() => {
        executeNavigation(pendingNavigation)
      }, 150)
      
    } catch (error) {
      console.error('保存して離脱の処理中にエラーが発生:', error)
      setNavigating(false)
      updateState({ showUnsavedWarning: true })
    }
  }, [onSave, handleForceLeave, setNavigating, updateState, executeNavigation])

  return {
    executeNavigation,
    handleForceLeave,
    handleSaveAndLeave
  }
} 