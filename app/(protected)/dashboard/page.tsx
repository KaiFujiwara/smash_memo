'use client'

import { useAuth } from '@/hooks/use-auth';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ダッシュボード</h1>
      
      {user && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <p className="text-lg mb-4">
            ようこそ、{user.displayName || "ユーザー"}さん
          </p>
          <p className="mb-4">
            スマブラSPのキャラクター対策メモを作成・管理できます。
          </p>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
