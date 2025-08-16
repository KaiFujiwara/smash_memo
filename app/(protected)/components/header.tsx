'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { User, Settings, LogOut, Home, Menu, X, ChevronDown, FileText } from 'lucide-react'
import { useHeader } from '@/contexts/headerContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const spUserMenuRef = useRef<HTMLDivElement>(null)
  const { characterName } = useHeader()

  // パス名からページタイトルとアイコンを取得
  const getPageInfo = (path: string) => {
    // キャラ対策メモページの場合
    if (path.startsWith('/memo/')) {
      const title = characterName || 'キャラ対策メモ'
      return { title, icon: FileText }
    }
    
    switch (path) {
      case '/dashboard':
        return { title: 'キャラ一覧', icon: Home }
      case '/memo-settings':
        return { title: 'メモ項目設定', icon: Settings }
      case '/account-setting':
        return { title: 'アカウント設定', icon: User }
      default:
        return { title: 'すまメモ！', icon: null }
    }
  }

  const pageInfo = getPageInfo(pathname)
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // ユーザーメニュー外クリック時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
          spUserMenuRef.current && !spUserMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
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
          {pageInfo.icon && (
            <pageInfo.icon className="text-white" size={20} />
          )}
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {pageInfo.title}
          </h1>
        </div>

        {/* PCナビゲーション */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            href="/dashboard" 
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/dashboard') 
                ? 'bg-white/20 text-white' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home size={18} />
            <span>キャラ一覧</span>
          </Link>
          
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
        <div className="flex flex-col p-4">
          <button 
            className="self-end rounded-full p-2 text-white" 
            onClick={closeMenu}
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
          
          <nav className="flex flex-col gap-4 mt-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10"
              onClick={closeMenu}
            >
              <Home size={20} />
              <span>キャラ一覧</span>
            </Link>
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