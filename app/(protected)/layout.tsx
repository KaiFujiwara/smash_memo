'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loading from '@/app/loading'
import Header from '@/app/(protected)/components/header'
import SimpleFooter from '@/components/ui/simple-footer'
import { HeaderProvider } from '@/contexts/headerContext'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <Loading />
  }

  // 認証済みの場合のみ子コンポーネントを表示
  return isAuthenticated ?  (
    <HeaderProvider>
      <div className="flex min-h-screen flex-col bg-gray-500/10">
        <Header />
        <main className="flex-1 py-4 sm:py-6">
          <div className="container mx-auto max-w-7xl px-4">
            {children}
          </div>
        </main>
        <SimpleFooter />
      </div>
    </HeaderProvider>
  ) : null
}