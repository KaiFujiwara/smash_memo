import type { Metadata } from 'next'
import { generateProtectedMetadata } from '@/lib/metadata'
import jaTranslations from './locales/ja.json'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'

export async function generateMetadata(): Promise<Metadata> {
  return generateProtectedMetadata(jaTranslations, enTranslations, zhTranslations);
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}