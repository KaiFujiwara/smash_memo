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
import { MemoItemCard } from './components/MemoItemCard'
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
  const { setCharacterName, setCharacterIcon, setCurrentCharacter } = useHeader()
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
        setCurrentCharacter(characterData)
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
      setCurrentCharacter(null)
    }
  }, [characterId, router, setCharacterName, setCharacterIcon, setCurrentCharacter])


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
              <MemoItemCard
                key={item.id}
                item={item}
                content={content}
                onContentChange={handleContentChange}
                onStartEditing={startEditing}
                onFinishEditing={finishEditing}
                onSave={handleSave}
                t={{
                  memo: t.memo,
                  image: t.image,
                }}
              />
            )
          })
        )}
      </div>

    </div>
  )
}