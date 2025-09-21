import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 多言語対応のルートページ
 * ログインページにリダイレクトする
 */
export default async function LocaleRootPage({ params }: PageProps) {
  const { locale } = await params;
  
  // ログインページにリダイレクト
  redirect(`/${locale}/login`);
}