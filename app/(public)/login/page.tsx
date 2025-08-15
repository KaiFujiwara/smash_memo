"use client";

import { signInWithRedirect } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Loading from '@/app/loading';

export default function LoginPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // 認証状態確認中はローディング表示
  if (isLoading) {
    return <Loading />
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithRedirect({
        provider: { custom: 'Auth0' }
      });
    } catch (error) {
      console.error("サインインエラー:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 背景画像 - 画像はpublic/imagesに配置する想定 */}
      <div className="absolute inset-0 z-0">

      </div>
      
      {/* コンテンツ */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:py-12">
        <div className=" overflow-hidden rounded-xl sm:rounded-2xl bg-white/90 shadow-xl backdrop-blur-sm">
          {/* ヘッダー部分 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 sm:px-8 sm:py-6 text-white">
            <div className="flex justify-center mb-2">
              <Image
                src="/logo.svg"
                alt="すまめも！"
                width={180}
                height={54}
                priority
              />
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-blue-100 text-center">
              スマブラSPのキャラ対策メモアプリ
            </p>
          </div>
          
          {/* 本体部分 */}
          <div className="p-5 sm:p-8 flex flex-col ">
            <p className="mb-6 sm:mb-8 text-center text-sm sm:text-base text-gray-700">
              スマブラSPの対戦キャラごとに対策メモを残せるアプリです。
            </p>
            
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="rounded-full bg-blue-600 py-3 px-6 text-white text-sm sm:text-base font-medium transition-colors duration-200 hover:bg-purple-600 disabled:opacity-70"
            >
              {isSigningIn ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
            
            <p className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-gray-500">
              ※ ログインすることで、
              <a href="/terms" className="text-blue-500 hover:underline" target="_blank">利用規約</a>
              および
              <a href="/privacy-policy" className="text-blue-500 hover:underline" target="_blank">プライバシーポリシー</a>
               に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
