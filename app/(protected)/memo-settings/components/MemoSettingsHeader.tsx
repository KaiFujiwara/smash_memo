/**
 * メモ設定ページのヘッダーコンポーネント
 */

import { Settings, Save, Keyboard } from 'lucide-react'

interface MemoSettingsHeaderProps {
  hasUnsavedChanges: boolean
  isSaving: boolean
  onSave: () => void
  onShowShortcuts: () => void
}

export function MemoSettingsHeader({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onShowShortcuts
}: MemoSettingsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-0.5">
      <div className="rounded-[10px] bg-white/5 backdrop-blur-sm">
        <div className="flex gap-3 px-4 py-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/10 p-2">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-md font-bold text-white md:text-xl">メモ項目設定</h1>
            {hasUnsavedChanges && (
              <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-medium text-yellow-900 animate-pulse">
                未保存 ⚠️
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowShortcuts}
              className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white backdrop-blur-sm transition hover:bg-white/20"
              title="キーボードショートカット (Cmd+/)"
            >
              <Keyboard size={16} />
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-indigo-600 shadow-md transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  変更を保存
                  {hasUnsavedChanges && <span className="ml-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 