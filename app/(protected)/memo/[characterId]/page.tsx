'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchCharacter } from '@/services/characterService'
import { getMemoItems } from '@/services/memoItemService'
import { getMemoContentsByCharacter, upsertMemoContent } from '@/services/memoContentService'
import { useHeader } from '@/contexts/headerContext'
import type { Character, MemoItem } from '@/types'

interface MemoContentState {
  [memoItemId: string]: {
    content: string
    isEditing: boolean
    originalContent: string
    hasUnsavedChanges: boolean
    lastSavedAt?: Date
  }
}

export default function CharacterMemoPage() {
  const params = useParams()
  const router = useRouter()
  const characterId = params.characterId as string
  const { setCharacterName, setCharacterIcon } = useHeader()

  const [character, setCharacter] = useState<Character | null>(null)
  const [memoItems, setMemoItems] = useState<MemoItem[]>([])
  const [memoContents, setMemoContents] = useState<MemoContentState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // データの初期読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // キャラクター情報、メモ項目、メモ内容を並列取得
        const [characterData, memoItemsResult, memoContentsData] = await Promise.all([
          fetchCharacter(characterId),
          getMemoItems({ visibleOnly: true }),
          getMemoContentsByCharacter(characterId)
        ])
        
        const memoItemsData = memoItemsResult.items

        if (!characterData) {
          toast.error('キャラクターが見つかりません')
          router.push('/character-list')
          return
        }

        setCharacter(characterData)
        setCharacterName(characterData.name)
        setCharacterIcon(characterData.icon)
        setMemoItems(memoItemsData)

        // メモ内容を初期化
        const contentState: MemoContentState = {}
        memoItemsData.forEach(item => {
          const existingContent = memoContentsData.find(
            content => content.memoItemId === item.id
          )
          
          contentState[item.id] = {
            content: existingContent?.content || '',
            isEditing: false,
            originalContent: existingContent?.content || '',
            hasUnsavedChanges: false,
            lastSavedAt: existingContent ? new Date() : undefined
          }
        })
        setMemoContents(contentState)

      } catch (error) {
        console.error('データの読み込みに失敗:', error)
        toast.error('データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    
    // クリーンアップ処理
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout)
      })
      setCharacterName(null)
      setCharacterIcon(null)
    }
  }, [characterId, router, setCharacterName, setCharacterIcon])

  // 自動保存機能
  const scheduleAutoSave = useCallback((memoItemId: string, content: string) => {
    // 既存のタイマーをクリア
    if (saveTimeoutRef.current[memoItemId]) {
      clearTimeout(saveTimeoutRef.current[memoItemId])
    }

    // 新しいタイマーを設定（2秒後に保存）
    saveTimeoutRef.current[memoItemId] = setTimeout(() => {
      saveMemo(memoItemId, content)
    }, 2000)
  }, [])

  // 編集開始
  const startEditing = (memoItemId: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        isEditing: true
      }
    }))
    
    // textareaの高さを調整するために少し遅延
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-memo-id="${memoItemId}"]`) as HTMLTextAreaElement
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`
      }
    }, 0)
  }

  // 編集終了（自動保存）
  const finishEditing = (memoItemId: string) => {
    const content = memoContents[memoItemId]
    if (content?.hasUnsavedChanges) {
      // 未保存の変更がある場合は即座に保存
      if (saveTimeoutRef.current[memoItemId]) {
        clearTimeout(saveTimeoutRef.current[memoItemId])
      }
      saveMemo(memoItemId, content.content)
    }
    
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        isEditing: false
      }
    }))
  }

  // メモ内容変更（自動保存付き）
  const handleContentChange = (memoItemId: string, newContent: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        content: newContent,
        hasUnsavedChanges: newContent !== prev[memoItemId].originalContent
      }
    }))
    
    // 自動保存をスケジュール
    scheduleAutoSave(memoItemId, newContent)
  }

  // メモクリア
  const clearMemo = async (memoItemId: string) => {
    const confirmed = window.confirm('このメモ項目の内容をクリアしますか？')
    if (!confirmed) return

    try {
      setIsSaving(memoItemId)
      
      // 空の内容で保存
      await upsertMemoContent(characterId, memoItemId, '')
      
      setMemoContents(prev => ({
        ...prev,
        [memoItemId]: {
          ...prev[memoItemId],
          content: '',
          originalContent: '',
          hasUnsavedChanges: false,
          lastSavedAt: new Date()
        }
      }))

      toast.success('メモをクリアしました')
    } catch (error) {
      console.error('メモのクリアに失敗:', error)
      toast.error('メモのクリアに失敗しました')
    } finally {
      setIsSaving(null)
    }
  }

  // メモ保存
  const saveMemo = async (memoItemId: string, content?: string) => {
    const contentToSave = content || memoContents[memoItemId]?.content || ''
    
    try {
      setIsSaving(memoItemId)
      
      await upsertMemoContent(characterId, memoItemId, contentToSave)
      
      setMemoContents(prev => ({
        ...prev,
        [memoItemId]: {
          ...prev[memoItemId],
          originalContent: contentToSave,
          hasUnsavedChanges: false,
          lastSavedAt: new Date()
        }
      }))

      // 自動保存の場合はトーストを表示しない
      if (!content) {
        toast.success('メモを保存しました')
      }
    } catch (error) {
      console.error('メモの保存に失敗:', error)
      toast.error('メモの保存に失敗しました')
    } finally {
      setIsSaving(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">キャラクターが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* メモ項目リスト */}
      <div className="space-y-6">
        {memoItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">メモ項目がありません</p>
            <p className="text-sm text-gray-400">
              <button
                onClick={() => router.push('/memo-settings')}
                className="text-blue-600 hover:underline"
              >
                メモ項目設定
              </button>
              でメモ項目を作成してください
            </p>
          </div>
        ) : (
          memoItems.map(item => {
            const content = memoContents[item.id]
            if (!content) return null

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* メモ項目ヘッダー */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium text-gray-800">{item.name}</h2>
                    {content.content && (
                      <button
                        onClick={() => clearMemo(item.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-xs"
                        disabled={isSaving === item.id}
                      >
                        <Trash2 size={14} />
                        クリア
                      </button>
                    )}
                  </div>
                </div>

                {/* メモ内容 */}
                <div className="p-4">
                  {content.isEditing ? (
                    <textarea
                      data-memo-id={item.id}
                      value={content.content}
                      onChange={(e) => handleContentChange(item.id, e.target.value)}
                      onBlur={() => finishEditing(item.id)}
                      placeholder="メモを入力してください..."
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ height: 'auto' }}
                      autoFocus
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.max(100, target.scrollHeight)}px`;
                      }}
                    />
                  ) : (
                    <div 
                      className="min-h-[80px] p-3 bg-gray-50 rounded-lg cursor-text hover:bg-gray-100 transition-colors"
                      onClick={() => startEditing(item.id)}
                    >
                      {content.content ? (
                        <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                          {content.content}
                        </pre>
                      ) : (
                        <p className="text-gray-500 italic">クリックしてメモを入力...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}