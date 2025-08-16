'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { User, Settings, LogOut, Home, Menu, X, ChevronDown, FileText, HelpCircle } from 'lucide-react'
import { useHeader } from '@/contexts/headerContext'
import { fetchCharacters } from '@/services/characterService'
import type { Character } from '@/types'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCharacterMenuOpen, setIsCharacterMenuOpen] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const spUserMenuRef = useRef<HTMLDivElement>(null)
  const characterMenuRef = useRef<HTMLDivElement>(null)
  const characterListRef = useRef<HTMLDivElement>(null)
  const { characterName, characterIcon } = useHeader()

  // 現在のキャラクターIDを取得
  const getCurrentCharacterId = () => {
    if (pathname.startsWith('/memo/')) {
      return pathname.split('/memo/')[1]
    }
    return null
  }

  const currentCharacterId = getCurrentCharacterId()

  // パス名からページタイトルとアイコンを取得
  const getPageInfo = (path: string) => {
    // キャラ対策メモページの場合
    if (path.startsWith('/memo/')) {
      const title = characterName || 'キャラ対策メモ'
      return { title, icon: null }
    }
    
    switch (path) {
      case '/character-list':
        return { title: 'キャラクターリスト', icon: Home }
      case '/memo-settings':
        return { title: 'メモ項目設定', icon: Settings }
      case '/account-setting':
        return { title: 'アカウント設定', icon: User }
      case '/help':
        return { title: 'ヘルプ', icon: HelpCircle }
      default:
        return { title: 'すまメモ！', icon: null }
    }
  }

  const pageInfo = getPageInfo(pathname)
  
  // キャラクターデータの読み込み
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const charactersData = await fetchCharacters()
        setCharacters(charactersData)
      } catch (error) {
        console.error('キャラクター読み込みエラー:', error)
      }
    }
    loadCharacters()
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)
  const toggleCharacterMenu = () => {
    setIsCharacterMenuOpen(!isCharacterMenuOpen)
  }

  // キャラクターメニューが開いたときの自動スクロール
  useEffect(() => {
    if (isCharacterMenuOpen && currentCharacterId && characterListRef.current) {
      // 少し遅延してからスクロールを実行（DOMの描画完了後）
      const timer = setTimeout(() => {
        const selectedElement = document.querySelector(`[data-character-id="${currentCharacterId}"]`)
        if (selectedElement && characterListRef.current) {
          // 即座にスクロール（smoothではなく）
          selectedElement.scrollIntoView({ 
            behavior: 'auto', 
            block: 'center' 
          })
        }
      }, 10)
      
      return () => clearTimeout(timer)
    }
  }, [isCharacterMenuOpen, currentCharacterId])

  const handleCharacterSelect = (characterId: string) => {
    router.push(`/memo/${characterId}`)
    setIsCharacterMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // メニュー外クリック時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
          spUserMenuRef.current && !spUserMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (characterMenuRef.current && !characterMenuRef.current.contains(event.target as Node)) {
        setIsCharacterMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 to-purple-700 shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* ページタイトル */}
        <div className="flex items-center gap-2">
          {pathname.startsWith('/memo/') && characterIcon ? (
            <img
              src={characterIcon}
              alt={characterName || 'キャラクター'}
              className="w-8 h-8 rounded-full object-contain bg-white border-2 border-gray-400"
            />
          ) : pageInfo.icon && (
            <pageInfo.icon className="text-white" size={20} />
          )}
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {pageInfo.title}
          </h1>
        </div>

        {/* PCナビゲーション */}
        <nav className="hidden md:flex items-center gap-1">
          {/* キャラクタードロップダウン */}
          <div className="relative" ref={characterMenuRef}>
            <button 
              onClick={toggleCharacterMenu}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname.startsWith('/memo/') || pathname === '/character-list'
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
              aria-label="キャラクター選択"
            >
              <Home size={18} />
              <span>キャラクター</span>
              <ChevronDown size={16} className={`transition-transform ${isCharacterMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* キャラクタードロップダウンメニュー - PC */}
            {isCharacterMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                {/* 全てのキャラクター */}
                <Link 
                  href="/character-list" 
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-200 sticky top-0 bg-white z-10"
                  onClick={() => setIsCharacterMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Home size={16} />
                  </div>
                  <span className="font-medium">全てのキャラクター</span>
                </Link>
                
                {/* キャラクターリスト - スクロール可能 */}
                <div ref={characterListRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      data-character-id={character.id}
                      onClick={() => handleCharacterSelect(character.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                        currentCharacterId === character.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
                      }`}
                    >
                      <img
                        src={character.icon}
                        alt={character.name}
                        className="w-8 h-8 rounded-full object-contain bg-white border border-gray-300"
                      />
                      <span>{character.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* ユーザーメニュー (PC) */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button 
              onClick={toggleUserMenu}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              aria-label="ユーザーメニュー"
            >
              <User size={20} />
              <span>アカウント</span>
              <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* ドロップダウンメニュー - PC */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                <Link 
                  href="/memo-settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings size={16} />
                  <span>メモ項目設定</span>
                </Link>
                <Link 
                  href="/account-setting" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User size={16} />
                  <span>アカウント設定</span>
                </Link>
                <Link 
                  href="/help" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <HelpCircle size={16} />
                  <span>ヘルプ</span>
                </Link>
                <button 
                  onClick={() => {
                    handleSignOut()
                    setIsUserMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={16} />
                  <span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* SPメニューボタン */}
        <button 
          className="rounded-full p-2 text-white md:hidden" 
          onClick={toggleMenu}
          aria-label="メニュー"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SPナビゲーションドロワー */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-64 flex flex-col transform bg-gradient-to-b from-blue-800 to-purple-900 shadow-xl transition-transform duration-200 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 上部メニュー */}
        <div className="flex flex-col p-4 flex-1 overflow-hidden">
          <button 
            className="self-end rounded-full p-2 text-white" 
            onClick={closeMenu}
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
          
          <nav className="flex flex-col gap-2 mt-4 flex-1 overflow-hidden">
            {/* 全てのキャラクター */}
            <Link 
              href="/character-list" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 border-b border-white/20 mb-2"
              onClick={closeMenu}
            >
              <Home size={20} />
              <span className="font-medium">全てのキャラクター</span>
            </Link>
            
            {/* キャラクターリスト - スクロール可能 */}
            <div className="flex-1 overflow-y-auto">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    handleCharacterSelect(character.id)
                    closeMenu()
                  }}
                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-2 text-left hover:bg-white/10 ${
                    currentCharacterId === character.id ? 'bg-white/20 text-white' : 'text-white/90'
                  }`}
                >
                  <img
                    src={character.icon}
                    alt={character.name}
                    className="w-6 h-6 rounded-full object-contain bg-white/10 border border-white/20"
                  />
                  <span className="text-sm">{character.name}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
        
        {/* 下部ユーザーメニュー */}
        <div 
          className="mt-auto border-t border-white/20 p-4" 
          ref={spUserMenuRef}
        >
          <button 
            onClick={toggleUserMenu}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-white hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <User size={20} />
              <span>アカウント</span>
            </div>
            <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* SPユーザードロップダウン */}
          {isUserMenuOpen && (
            <div className="mt-2 rounded-xl bg-white/10 py-1 overflow-hidden">
              <Link 
                href="/memo-settings" 
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/20"
                onClick={closeMenu}
              >
                <Settings size={20} />
                <span>メモ項目設定</span>
              </Link>
              <Link 
                href="/account-setting" 
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/20"
                onClick={closeMenu}
              >
                <User size={20} />
                <span>アカウント設定</span>
              </Link>
              <Link 
                href="/help" 
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/20"
                onClick={closeMenu}
              >
                <HelpCircle size={20} />
                <span>ヘルプ</span>
              </Link>
              <button 
                onClick={() => {
                  handleSignOut()
                  closeMenu()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/20"
              >
                <LogOut size={20} />
                <span>ログアウト</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* SPメニューオーバーレイ */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={closeMenu}
        />
      )}
    </header>
  )
}