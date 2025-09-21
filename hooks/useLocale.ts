import { useEffect, useState } from 'react';

export type SupportedLocale = 'ja' | 'en' | 'zh';

export function useLocale(params: Promise<{ locale: string }>) {
  const [locale, setLocale] = useState<SupportedLocale>('ja');
  const supportedLocales: SupportedLocale[] = ['ja', 'en', 'zh'];

  useEffect(() => {
    // 即座にURLから言語を推測（リロード対応）
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments[0] && supportedLocales.includes(pathSegments[0] as SupportedLocale)) {
        setLocale(pathSegments[0] as SupportedLocale);
      }
    }
    
    // paramsからも取得（ナビゲーション時用）
    params.then(({ locale: paramLocale }) => {
      if (paramLocale && supportedLocales.includes(paramLocale as SupportedLocale)) {
        setLocale(paramLocale as SupportedLocale);
      }
    }).catch(() => {
      // パラメータから取得できない場合はブラウザ言語を検出
      const detectedLocale = getDetectedLocale();
      setLocale(detectedLocale);
    });
  }, [params]);

  // ブラウザから言語を検出する関数
  const getDetectedLocale = (): SupportedLocale => {
    // 1. Cookieから取得
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