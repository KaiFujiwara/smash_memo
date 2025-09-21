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