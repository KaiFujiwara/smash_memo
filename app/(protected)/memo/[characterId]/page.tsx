'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useProtectedTranslations } from '@/hooks/useProtectedTranslations'
import { fetchCharacter } from '@/services/characterService'
import { getMemoItems } from '@/services/memoItemService'
import { getMemoContentsByCharacter, updateMemoContent, createMemoContent } from '@/services/memoContentService'
import { useHeader } from '@/contexts/headerContext'
import Loading from '@/app/loading'
import type { Character, MemoItem } from '@/types'
import jaTranslations from './locales/ja.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

interface MemoContentState {
  [memoItemId: string]: {
    id?: string           // DynamoDBのレコードID
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
  const { t } = useProtectedTranslations(jaTranslations, enTranslations, zhTranslations)

  const [character, setCharacter] = useState<Character | null>(null)
  const [memoItems, setMemoItems] = useState<MemoItem[]>([])
  const [memoContents, setMemoContents] = useState<MemoContentState>({})
  const [isLoading, setIsLoading] = useState(true)

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
          toast.error(t.messages.characterNotFound)
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
            id: existingContent?.id,  // DynamoDBのレコードIDを保持
            content: existingContent?.content || '',
            isEditing: false,
            originalContent: existingContent?.content || '',
            hasUnsavedChanges: false,
            lastSavedAt: existingContent ? new Date() : undefined
          }
        })
        setMemoContents(contentState)


      } catch (error) {
        console.error(t.errors.dataLoadConsole, error)
        toast.error(t.messages.dataLoadError)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    
    // クリーンアップ処理
    return () => {
      setCharacterName(null)
      setCharacterIcon(null)
    }
  }, [characterId, router, setCharacterName, setCharacterIcon])


  // メモ保存
  const saveMemo = useCallback(async (memoItemId: string, content: string) => {
    try {
      const currentState = memoContents[memoItemId]
      let result
      
      if (currentState?.id) {
        // IDがある場合は直接更新（検索不要）
        result = await updateMemoContent({
          id: currentState.id,
          content
        })
      } else {
        // IDがない場合のみ新規作成
        result = await createMemoContent({
          characterId,
          memoItemId,
          content
        })
      }

      setMemoContents(prev => ({
        ...prev,
        [memoItemId]: {
          ...prev[memoItemId],
          id: result.id,           // 作成時のIDを保存
          originalContent: content,
          hasUnsavedChanges: false,
          lastSavedAt: new Date()
        }
      }))
      
      toast.success(t.messages.memoSaved)
    } catch (error) {
      console.error(t.errors.memoSaveConsole, error)
      toast.error(t.messages.memoSaveError)
    }
  }, [characterId, memoContents])

  // 編集開始
  const startEditing = (memoItemId: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        isEditing: true
      }
    }))
    
    // textareaの高さを調整とカーソル位置を設定するために少し遅延
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-memo-id="${memoItemId}"]`) as HTMLTextAreaElement
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
        // カーソルを最後に移動
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        textarea.focus()
      }
    }, 0)
  }

  // 編集終了
  const finishEditing = (memoItemId: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        isEditing: false
      }
    }))
  }

  // メモ内容変更
  const handleContentChange = (memoItemId: string, newContent: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        content: newContent,
        hasUnsavedChanges: newContent !== prev[memoItemId].originalContent
      }
    }))
  }

  // 保存処理
  const handleSave = (memoItemId: string) => {
    const content = memoContents[memoItemId]
    if (content) {
      saveMemo(memoItemId, content.content)
    }
  }


  if (isLoading) {
    return <Loading />
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t.messages.characterNotFound}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* メモ項目リスト */}
      <div className="space-y-3 sm:space-y-4">
        {memoItems.length === 0 ? (
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 max-w-md mx-auto">
              <div className="space-y-3">
                <p className="text-blue-900 dark:text-blue-100 font-semibold">
                  {t.emptyState.title}
                </p>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {/* PC版の導線 */}
                  <p className="hidden sm:block">
                    {t.emptyState.guidePc}
                  </p>
                  {/* SP版の導線 */}
                  <p className="sm:hidden">
                    {t.emptyState.guideMobile}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          memoItems.map(item => {
            const content = memoContents[item.id]
            if (!content) return null

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* メモ項目ヘッダー */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium text-gray-800">{item.name}</h2>
                      {/* 未保存マーク */}
                      {content.hasUnsavedChanges && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {t.memo.unsaved}
                        </span>
                      )}
                    </div>
                    {/* 保存ボタン（変更があるときのみ表示） */}
                    {content.hasUnsavedChanges && (
                      <button
                        onClick={() => handleSave(item.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-medium transition-colors shadow-sm"
                        title={t.memo.saveTitle}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t.memo.save}
                      </button>
                    )}
                  </div>
                </div>

                {/* メモ内容 */}
                <div className="p-2 sm:p-4">
                  {content.isEditing ? (
                    <textarea
                      data-memo-id={item.id}
                      value={content.content}
                      onChange={(e) => handleContentChange(item.id, e.target.value)}
                      onBlur={() => finishEditing(item.id)}
                      placeholder={t.memo.placeholder}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ height: 'auto' }}
                      autoFocus
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  ) : (
                    <div 
                      className="sm:min-h-[80px] p-3 bg-gray-50 rounded-lg cursor-text hover:bg-gray-100 transition-colors"
                      onClick={() => startEditing(item.id)}
                    >
                      {content.content ? (
                        <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                          {content.content}
                        </pre>
                      ) : (
                        <p className="text-gray-500 italic">{t.memo.emptyPlaceholder}</p>
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