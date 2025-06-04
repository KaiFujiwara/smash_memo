/**
 * ダッシュボードヘッダーコンポーネント
 * 
 * ダッシュボード画面のヘッダー部分を表示します。
 * 編集モードの切り替えボタンを含みます。
 */

'use client'

import { Button } from '@/components/ui/button'
import type { DashboardMode } from '@/types'

/**
 * ダッシュボードヘッダーのプロパティ
 */
interface DashboardHeaderProps {
  /** 現在の表示モード */
  mode: DashboardMode
  /** モード切り替え時のコールバック */
  onModeChange: (mode: DashboardMode) => void
  /** 新規カテゴリー追加時のコールバック */
  onAddCategory?: () => void
}

/**
 * ダッシュボードヘッダーコンポーネント
 */
export function DashboardHeader({
  mode,
  onModeChange,
  onAddCategory
}: DashboardHeaderProps) {
  /**
   * 編集モード切り替え
   */
  const toggleMode = () => {
    const newMode = mode === 'view' ? 'edit' : 'view'
    onModeChange(newMode)
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {/* タイトル */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">キャラクター一覧</h1>
        <p className="text-sm text-gray-600 mt-1">
          {mode === 'view' 
            ? 'キャラクターをクリックしてメモを確認・編集できます' 
            : 'カテゴリーの管理モードです'
          }
        </p>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        {mode === 'edit' && onAddCategory && (
          <Button variant="outline" onClick={onAddCategory}>
            カテゴリー追加
          </Button>
        )}
        
        <Button 
          variant={mode === 'edit' ? 'default' : 'outline'}
          onClick={toggleMode}
        >
          {mode === 'edit' ? '編集完了' : '編集モード'}
        </Button>
      </div>
    </div>
  )
}