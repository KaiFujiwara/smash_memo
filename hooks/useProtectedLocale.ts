import { useEffect, useState } from 'react';

export type SupportedLocale = 'ja' | 'en' | 'zh';

/**
 * 認証済みページ用の言語検出フック
 * URLパスに言語を含めず、Cookie/ブラウザ言語から検出
 */
export function useProtectedLocale() {
  const [locale, setLocale] = useState<SupportedLocale>('ja');
  const supportedLocales: SupportedLocale[] = ['ja', 'en', 'zh'];

  useEffect(() => {
    const detectedLocale = getDetectedLocale();
    setLocale(detectedLocale);
  }, []);

  // ブラウザから言語を検出する関数
  const getDetectedLocale = (): SupportedLocale => {
    if (typeof window === 'undefined') return 'ja';
    
    // 1. Cookieから取得（最優先）
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];
    
    if (cookieLocale && supportedLocales.includes(cookieLocale as SupportedLocale)) {
      return cookieLocale as SupportedLocale;
    }
    
    // 2. ブラウザ言語から取得
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && supportedLocales.includes(browserLang as SupportedLocale)) {
      return browserLang as SupportedLocale;
    }
    
    return 'ja';
  };

  return locale;
}