'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, deleteUser, signOut } from 'aws-amplify/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, User, Mail, Calendar } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true)
      await deleteUser()
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('アカウント削除に失敗しました', error)
      setDeleteLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">アカウント設定</h1>
      
      <Card className="mb-8 overflow-hidden shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-xl">アカウント情報</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">ユーザー名</p>
                <p className="font-medium">{user?.username || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">メールアドレス</p>
                <p className="font-medium">{user?.attributes?.email || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">アカウント作成日</p>
                <p className="font-medium">
                  {user?.attributes?.email_verified_at 
                    ? formatDate(user.attributes.email_verified_at) 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-4">
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="mt-2"
          >
            アカウントを削除する
          </Button>
        </CardFooter>
      </Card>

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsDeleteDialogOpen(false)}>
          <div 
            className="rounded-xl bg-white p-6 shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-bold">アカウント削除の確認</h2>
            </div>
            
            <p className="mb-6 text-gray-700">
              アカウントを削除すると、すべてのメモデータと設定が完全に削除されます。<br />
              本当に削除しますか？
            </p>
            
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteLoading}
              >
                キャンセル
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    削除中...
                  </>
                ) : (
                  '削除する'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}