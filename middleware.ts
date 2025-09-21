import { NextRequest, NextResponse } from 'next/server';

const locales = ['ja', 'en', 'zh'];
const defaultLocale = 'ja';

// ユーザーの優先言語を取得（クッキー > Accept-Language > デフォルト）
function getPreferredLocale(request: NextRequest): string {
  // 1. クッキーから言語設定を確認
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  
  // 2. Accept-Languageヘッダーから優先言語を取得
  const acceptLanguage = request.headers.get('accept-language');
  
  if (!acceptLanguage) return defaultLocale;
  
  // Accept-Languageをパース（例: "en-US,en;q=0.9,ja;q=0.8"）
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.split('=')[1] || '1');
      return { locale: locale.split('-')[0], quality }; // en-US -> en
    })
    .sort((a, b) => b.quality - a.quality); // 品質値で降順ソート
  
  // サポートしている言語の中から最初に見つかったものを返す
  for (const { locale } of languages) {
    if (locales.includes(locale)) {
      return locale;
    }
  }
  
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // クエリストリングを保持するためのURL構築用関数
  const buildUrlWithQuery = (newPathname: string) => {
    const url = new URL(request.url);
    url.pathname = newPathname;
    return url;
  };
  
  // 既に言語パス（デフォルト以外）がある場合はそのまま通す
  const nonDefaultLocales = locales.filter(locale => locale !== defaultLocale);
  const pathnameHasNonDefaultLocale = nonDefaultLocales.some(locale =>
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameHasNonDefaultLocale) {
    return NextResponse.next();
  }
  
  // /ja/* の場合は /ja を除去してリダイレクト
  if (pathname.startsWith('/ja/') || pathname === '/ja') {
    const newPathname = pathname === '/ja' ? '/' : pathname.replace('/ja', '');
    return NextResponse.redirect(buildUrlWithQuery(newPathname));
  }
  
  // ユーザーの優先言語を取得（クッキー > Accept-Language > デフォルト）
  const preferredLocale = getPreferredLocale(request);
  
  // ルートパス（/）の場合、優先言語に基づいてloginページにリダイレクト
  if (pathname === '/') {
    if (preferredLocale !== defaultLocale) {
      return NextResponse.redirect(buildUrlWithQuery(`/${preferredLocale}/login`));
    } else {
      return NextResponse.redirect(buildUrlWithQuery('/login'));
    }
  }
  
  // デフォルトロケール用の処理：内部的に優先言語の/* にrewrite
  const targetLocale = preferredLocale === defaultLocale ? defaultLocale : preferredLocale;
  return NextResponse.rewrite(
    buildUrlWithQuery(`/${targetLocale}${pathname}`)
  );
}


export const config = {
  matcher: [
    /*
     * (public)/[locale]ディレクトリ下のパスのみmiddlewareを適用
     * - /en/*, /ja/* (app/(public)/[locale]/ 下のすべて)
     * - /login, /terms, /privacy-policy (→ /ja/* にrewrite)
     * - / (ルート)
     * 
     * それ以外（/dashboard, /character-list等）はmiddlewareをスルー
     */
    '/(en|ja)|zh/:path*',                    // (public)/[locale]ディレクトリ下
    '/(login|terms|privacy-policy)',      // デフォルトロケール（→ /ja/* へrewrite）
    '/'                                   // ルート
  ]
};