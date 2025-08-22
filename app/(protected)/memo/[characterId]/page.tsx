'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { fetchCharacter } from '@/services/characterService'
import { getMemoItems } from '@/services/memoItemService'
import { getMemoContentsByCharacter, upsertMemoContent } from '@/services/memoContentService'
import { useHeader } from '@/contexts/headerContext'
import Loading from '@/app/loading'
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
  const debounceTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // 古い保存レスポンスが最新を上書きしないように連番管理
  const saveSeqRef = useRef<Record<string, number>>({})
  // 既存の state 群の下あたりに追加
  const memoContentsRef = useRef(memoContents)
  // 離脱時保存用の事前準備情報
  const exitSaveInfoRef = useRef<{
    token: string
    endpoint: string
    ownerId: string
    existingIds: Record<string, string> // memoItemId -> existingContentId
  } | null>(null)

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

        // 離脱時保存用の情報を事前準備
        await prepareExitSaveInfo(memoContentsData)

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
      Object.values(debounceTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout)
      })
      setCharacterName(null)
      setCharacterIcon(null)
    }
  }, [characterId, router, setCharacterName, setCharacterIcon])

  useEffect(() => { memoContentsRef.current = memoContents }, [memoContents])

  // 離脱時保存用の情報を事前準備
  const prepareExitSaveInfo = useCallback(async (memoContentsData: any[]) => {
    try {
      // 1. idTokenを事前取得（Bearer不要）
      const { fetchAuthSession } = await import('aws-amplify/auth')
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString() || ''

      // 2. GraphQLエンドポイントを事前取得
      const { Amplify } = await import('aws-amplify')
      const config = Amplify.getConfig()
      const endpoint = config.API?.GraphQL?.endpoint || ''

      // 3. ownerIdを事前取得
      const { getCurrentUser } = await import('aws-amplify/auth')
      const user = await getCurrentUser()
      const ownerId = `${user.userId}::${user.username}`

      // 4. 既存のメモ内容IDを事前取得
      const existingIds: Record<string, string> = {}
      memoContentsData.forEach(content => {
        if (content.memoItemId && content.id) {
          existingIds[content.memoItemId] = content.id
        }
      })

      // 離脱時保存用の情報を保存
      exitSaveInfoRef.current = {
        token,
        endpoint,
        ownerId,
        existingIds
      }

    } catch (error) {
      console.error('離脱時保存の準備に失敗:', error)
      // エラーでも処理は継続（通常の保存は動く）
    }
  }, [])

  // メモ保存（静かに自動保存、エラー時のみ通知）
  const saveMemo = useCallback(async (memoItemId: string, content: string, isPageExit = false) => {
    // この保存リクエストに連番を振る
    const seq = (saveSeqRef.current[memoItemId] ?? 0) + 1
    saveSeqRef.current[memoItemId] = seq

    try {
      // 離脱時はkeepaliveオプションを使用
      const result = await upsertMemoContent(characterId, memoItemId, content, { 
        keepalive: isPageExit 
      })

      // 最新の保存じゃなければ無視（古い戻りを捨てる）
      if (saveSeqRef.current[memoItemId] !== seq) return

      // 離脱時は状態更新をスキップ（意味がない & パフォーマンス向上）
      if (isPageExit) return

      // 通常保存時で新規作成の場合、existingIdを更新
      if (!exitSaveInfoRef.current?.existingIds[memoItemId] && result.id !== 'keepalive-dummy') {
        if (exitSaveInfoRef.current) {
          exitSaveInfoRef.current.existingIds[memoItemId] = result.id
        }
      }

      setMemoContents(prev => {
        const now = prev[memoItemId]
        // 保存完了時点でユーザーがさらに入力してたら dirty 継続
        const stillDirty = now?.content !== content
        return {
          ...prev,
          [memoItemId]: {
            ...now,
            originalContent: content,
            hasUnsavedChanges: stillDirty,
            lastSavedAt: new Date()
          }
        }
      })
      // 成功トーストは出さない（静かに自動保存）
    } catch (error) {
      // 離脱時はエラー処理をスキップ
      if (isPageExit) return
      
      console.error('メモの保存に失敗:', error)
      toast.error('メモの保存に失敗しました')
    }
  }, [characterId])

  // デバウンス保存機能（PC・SP共通）
  const debouncedSave = useCallback((memoItemId: string, content: string) => {
    // 既存のデバウンスタイマーをクリア
    if (debounceTimeoutRef.current[memoItemId]) {
      clearTimeout(debounceTimeoutRef.current[memoItemId])
    }

    // 新しいデバウンスタイマーを設定（0.5秒後に保存）
    // contentを直接渡すことで、古い値の問題を回避
    debounceTimeoutRef.current[memoItemId] = setTimeout(() => {
      saveMemo(memoItemId, content)
    }, 500)
  }, [saveMemo])

  const flushAllPendingSaves = useCallback(() => {
    // デバウンス中を止める
    Object.values(debounceTimeoutRef.current).forEach(t => clearTimeout(t))
    debounceTimeoutRef.current = {}

    // 離脱時保存の事前準備情報が無い場合は従来方式
    if (!exitSaveInfoRef.current) {
      console.warn('Exit save info not prepared, using fallback')
      const entries = Object.entries(memoContentsRef.current)
      for (const [id, c] of entries) {
        if (c?.hasUnsavedChanges) {
          void saveMemo(id, c.content, true)
        }
      }
      return
    }

    // 最適化版：事前準備情報を使って1リクエストのみで確実送信
    const { token, endpoint, ownerId, existingIds } = exitSaveInfoRef.current
    
    const entries = Object.entries(memoContentsRef.current)
    for (const [memoItemId, c] of entries) {
      if (c?.hasUnsavedChanges) {
        void sendOptimizedKeepaliveSave(
          endpoint,
          token,
          ownerId,
          characterId,
          memoItemId,
          c.content,
          existingIds[memoItemId]
        )
      }
    }
  }, [saveMemo, characterId])

  // 最適化版keepalive保存（1リクエストのみ）
  const sendOptimizedKeepaliveSave = useCallback(async (
    endpoint: string,
    token: string,
    _ownerId: string,
    characterId: string,
    memoItemId: string,
    content: string,
    existingId?: string
  ) => {
    try {
      // 更新 or 作成を判定
      let mutation: string
      let variables: any

      if (existingId) {
        // 更新（既存IDがある場合）
        mutation = `
          mutation UpdateMemoContent($input: UpdateMemoContentInput!) {
            updateMemoContent(input: $input) {
              id
            }
          }
        `
        variables = {
          input: {
            id: existingId,
            content
          }
        }
      } else {
        // 作成（既存IDがない場合）
        mutation = `
          mutation CreateMemoContent($input: CreateMemoContentInput!) {
            createMemoContent(input: $input) {
              id
            }
          }
        `
        variables = {
          input: {
            characterId,
            memoItemId,
            content
          }
        }
      }

      // keepalive で1回のリクエストで確実送信
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token  // idToken直接（Bearer不要）
        },
        body: JSON.stringify({
          query: mutation,
          variables
        }),
        keepalive: true
      })

    } catch (error) {
      console.error('Optimized keepalive save failed:', error)
      // 離脱時はエラーを投げない
    }
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) flushAllPendingSaves()
    }
    const onPageHide = () => {
      flushAllPendingSaves()
    }
    const onBeforeUnload = () => {
      flushAllPendingSaves()
    }

    document.addEventListener('visibilitychange', onVisibilityChange, { passive: true })
    window.addEventListener('pagehide', onPageHide, { passive: true })
    window.addEventListener('beforeunload', onBeforeUnload, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      flushAllPendingSaves() // アンマウント時も保険
    }
  }, [flushAllPendingSaves])

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

  // メモ内容変更（デバウンス保存付き）
  const handleContentChange = (memoItemId: string, newContent: string) => {
    setMemoContents(prev => ({
      ...prev,
      [memoItemId]: {
        ...prev[memoItemId],
        content: newContent,
        hasUnsavedChanges: newContent !== prev[memoItemId].originalContent
      }
    }))
    
    // デバウンス保存をトリガー
    debouncedSave(memoItemId, newContent)
  }

  if (isLoading) {
    return <Loading />
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
      <div className="space-y-3 sm:space-y-4">
        {memoItems.length === 0 ? (
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 max-w-md mx-auto">
              <div className="space-y-3">
                <p className="text-blue-900 dark:text-blue-100 font-semibold">
                  メモ項目がまだ設定されていません
                </p>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {/* PC版の導線 */}
                  <p className="hidden sm:block">
                    画面上部の<span className="font-semibold">「共通メモ項目設定」</span>から設定してください
                  </p>
                  {/* SP版の導線 */}
                  <p className="sm:hidden">
                    画面右上のメニュー（≡）を開いて下部にある<span className="font-semibold">「共通メモ項目設定」</span>から設定してください
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
                    <h2 className="text-base font-medium text-gray-800">{item.name}</h2>
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
                      placeholder="メモを入力してください..."
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
                        <p className="text-gray-500 italic">メモを入力...</p>
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