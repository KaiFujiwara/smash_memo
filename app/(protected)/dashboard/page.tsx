'use client'

import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="">
        <h1>ダッシュボード</h1>
    </div>
  );
}
