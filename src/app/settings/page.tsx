'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            ← 戻る
          </Link>
          <span className="font-bold text-emerald-700">設定</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* プロフィール */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">👤 プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">メールアドレス</span>
              <span className="font-medium truncate max-w-[200px]">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ユーザーID</span>
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                {user?.id}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定（将来実装） */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">🔔 通知設定</CardTitle>
            <CardDescription>Coming soon...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              習慣のリマインダー通知は今後実装予定です。
            </p>
          </CardContent>
        </Card>

        {/* テーマ設定（将来実装） */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">🎨 テーマ設定</CardTitle>
            <CardDescription>Coming soon...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ダークモードなどのテーマ設定は今後実装予定です。
            </p>
          </CardContent>
        </Card>

        {/* アカウント操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">⚙️ アカウント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              ログアウト
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2">
          HabiMon v0.1.0
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
