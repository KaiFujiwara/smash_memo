import type { Metadata } from "next";

export function withSiteTitle(title: string) {
    return `${title} - スマメモ`;
}

export interface TranslationMetadata {
  metadata: {
    title: string;
    description: string;
  };
}

export async function generateLocaleMetadata(
  params: Promise<{ locale: string }>,
  jaTranslations: TranslationMetadata,
  enTranslations: TranslationMetadata,
  zhTranslations: TranslationMetadata
): Promise<Metadata> {
  const { locale } = await params;
  
  const translationsMap = {
    ja: jaTranslations,
    en: enTranslations,
    zh: zhTranslations
  };
  
  const translations = translationsMap[locale as keyof typeof translationsMap] || jaTranslations;
  
  return {
    title: translations.metadata.title,
    description: translations.metadata.description
  };
}

export async function generateProtectedMetadata(
  jaTranslations: TranslationMetadata,
  enTranslations: TranslationMetadata,
  zhTranslations: TranslationMetadata
): Promise<Metadata> {
  // サーバーサイドでCookie/Accept-Languageから言語を検出
  const { headers } = await import('next/headers');
  const headersList = await headers();
  
  const detectedLocale = await getServerSideLocale(headersList);
  
  const translationsMap = {
    ja: jaTranslations,
    en: enTranslations,
    zh: zhTranslations
  };
  
  const translations = translationsMap[detectedLocale];
  
  return {
    title: translations.metadata.title,
    description: translations.metadata.description
  };
}

async function getServerSideLocale(headersList: any): Promise<'ja' | 'en' | 'zh'> {
  const supportedLocales = ['ja', 'en', 'zh'] as const;
  
  // 1. Cookieから取得
  const cookieHeader = await headersList.get('cookie');
  if (cookieHeader) {
    const cookieLocale = cookieHeader
      .split('; ')
      .find((row: string) => row.startsWith('locale='))
      ?.split('=')[1];
    
    if (cookieLocale && supportedLocales.includes(cookieLocale as any)) {
      return cookieLocale as 'ja' | 'en' | 'zh';
    }
  }
  
  // 2. Accept-Languageから取得
  const acceptLang = await headersList.get('accept-language');
  if (acceptLang) {
    const browserLang = acceptLang.split(',')[0]?.split('-')[0];
    if (browserLang && supportedLocales.includes(browserLang as any)) {
      return browserLang as 'ja' | 'en' | 'zh';
    }
  }
  
  return 'ja';
}