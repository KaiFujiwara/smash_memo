import { useProtectedLocale } from './useProtectedLocale';

interface TranslationData {
  metadata: {
    title: string;
    description: string;
  };
  [key: string]: any;
}

/**
 * 認証済みページ用の翻訳フック
 * 言語検出と翻訳テキスト取得を一括で処理
 */
export function useProtectedTranslations<T extends TranslationData>(
  jaTranslations: T,
  enTranslations: T,
  zhTranslations: T
) {
  const locale = useProtectedLocale();
  
  const translationsMap = {
    ja: jaTranslations,
    en: enTranslations,
    zh: zhTranslations
  };
  
  const t = translationsMap[locale];
  
  return { locale, t };
}