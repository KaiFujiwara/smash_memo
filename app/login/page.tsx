"use client";

import { signInWithRedirect } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithRedirect({
        provider: { custom: 'Auth0' }
      });
    } catch (error) {
      console.error("サインインエラー:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">すまめも！</h1>
        <p className="mb-6 text-center">
          スマブラSPの対戦キャラごとに対策メモを残せるアプリです。<br />
          ログインして利用を開始しましょう。
        </p>
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "Auth0でログイン"}
        </button>
      </div>
    </div>
  );
}
