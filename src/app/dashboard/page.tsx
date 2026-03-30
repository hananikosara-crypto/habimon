'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/auth')
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🥚</div>
        <h1 className="text-2xl font-bold text-emerald-700">ダッシュボード</h1>
        <p className="text-muted-foreground">Coming soon...</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <Button variant="outline" onClick={handleSignOut}>サインアウト</Button>
      </div>
    </div>
  )
}
