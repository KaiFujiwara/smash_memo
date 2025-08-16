import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 保護されたルート（認証が必要なページ）
const protectedRoutes = [
  '/memo',
  '/category',
  '/memo-template',
  '/account'
];

// 公開ルート（認証不要とするパス）
const publicRoutes = [
  '/',
  '/login/callback',
  '/api/auth'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Amplify/Cognitoのセッションクッキーをチェック
  const isAuthenticated = request.cookies.has('amplify-signin-with-hostedUI');
  
  // パスが保護されたルートかどうかチェック
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // 認証が必要なルートで未認証の場合
  if (isProtectedRoute && !isAuthenticated) {
    // ログインページにリダイレクト（そこからAmplifyのsignInWithRedirectが実行される）
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 既に認証済みでログインページにアクセスした場合
  if (pathname === '/login' && isAuthenticated) {
    // ホームページにリダイレクト
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    // 静的ファイル以外のすべてのリクエストに適用
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 