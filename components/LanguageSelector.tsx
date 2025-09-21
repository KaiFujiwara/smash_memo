"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' }
];

interface LanguageSelectorProps {
  currentLocale: string;
}

export default function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages.find(lang => lang.code === currentLocale) || languages[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // currentLocaleが変更されたら選択言語を更新
  useEffect(() => {
    setSelectedLanguage(
      languages.find(lang => lang.code === currentLocale) || languages[0]
    );
  }, [currentLocale]);

  // クリック外で閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (language: Language) => {
    if (language.code === selectedLanguage.code) {
      setIsOpen(false);
      return;
    }

    // クッキーに言語設定を保存
    document.cookie = `locale=${language.code}; path=/; max-age=${365 * 24 * 60 * 60}`;
    
    // URLのパスを解析して言語を切り替え
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // 現在のパスに言語コードが含まれているかチェック
    const hasLocaleInPath = languages.some(lang => pathSegments[0] === lang.code);
    
    let newPath: string;
    
    if (hasLocaleInPath) {
      // 既存の言語コードを置き換え
      if (language.code !== 'ja') {
        pathSegments[0] = language.code;
        newPath = `/${pathSegments.join('/')}`;
      } else {
        // 日本語の場合は言語コードを除去
        pathSegments.shift(); // 最初の言語コードを削除
        newPath = `/${pathSegments.join('/')}`;
      }
    } else {
      // 言語コードを追加（デフォルト言語以外の場合）
      if (language.code !== 'ja') {
        newPath = `/${language.code}${pathname}`;
      } else {
        // 日本語の場合は言語コードなし
        newPath = pathname;
      }
    }
    
    // ページをリロード
    router.push(newPath);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium">{selectedLanguage.name}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full min-w-[150px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                language.code === selectedLanguage.code ? 'bg-gray-50 font-semibold' : ''
              }`}
            >
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}