'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (user) {
      // ログイン済み → ダッシュボードへ（未実装時は onboarding へ）
      router.replace('/dashboard')
    } else {
      // 未ログイン → ログイン画面へ
      router.replace('/auth')
    }
  }, [user, loading, router])

  // リダイレクト中のローディング表示
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-2">🥚</p>
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    </div>
  )
}
