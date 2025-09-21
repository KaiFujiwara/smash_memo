'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import type { SupportedLocale } from '@/hooks/useProtectedLocale'

interface ProtectedLanguageSelectorProps {
  currentLocale: SupportedLocale
  variant?: 'desktop' | 'mobile'
}

export default function ProtectedLanguageSelector({ 
  currentLocale, 
  variant = 'desktop' 
}: ProtectedLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'ja' as const, name: '日本語' },
    { code: 'en' as const, name: 'English' },
    { code: 'zh' as const, name: '中文' },
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    // Cookieに言語を保存してリロード
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}` // 1年
    window.location.reload()
  }

  // メニュー外クリック時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-white hover:bg-white/10"
          aria-label="言語選択"
        >
          <div className="flex items-center gap-3">
            <Globe size={20} />
            <span>{currentLanguage.name}</span>
          </div>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-2 rounded-xl bg-white/10 py-1 overflow-hidden">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  handleLanguageChange(language.code)
                  setIsOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/20 ${
                  language.code === currentLocale ? 'bg-white/20' : ''
                }`}
              >
                <Globe size={20} />
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
        aria-label="言語選択"
      >
        <Globe size={16} />
        <span>{currentLanguage.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                handleLanguageChange(language.code)
                setIsOpen(false)
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                language.code === currentLocale ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}