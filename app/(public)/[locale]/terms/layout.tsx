import type { Metadata } from "next";
import { generateLocaleMetadata } from "@/lib/metadata";
import jaTranslations from './locales/ja.json';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return generateLocaleMetadata(params, jaTranslations, enTranslations, zhTranslations);
}

export default function TermsLayout({
  children,
}: LayoutProps) {
  return <>{children}</>;
}
