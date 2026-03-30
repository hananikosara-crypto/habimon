'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { getStageEmoji } from '@/constants/monster'
import { getEvolutionTable } from '@/constants/evolution'
import MonsterStats from '@/components/MonsterStats'
import BottomNav from '@/components/BottomNav'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { GoalCategory, CourseType, MonsterStage } from '@/types'

type MonsterData = {
  id: string
  name: string
  stage: MonsterStage
  total_points: number
  level: number
}

type StatsData = {
  int_val: number
  str_val: number
  mnd_val: number
  dex_val: number
  cha_val: number
}

type GoalData = {
  id: string
  title: string
  category: GoalCategory
  course_type: CourseType
}

export default function MonsterPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [goal, setGoal] = useState<GoalData | null>(null)
  const [monster, setMonster] = useState<MonsterData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    const fetch = async () => {
      setLoading(true)

      // アクティブな目標を取得
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, title, category, course_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!goalsData || goalsData.length === 0) {
        router.replace('/onboarding')
        return
      }

      const primaryGoal = goalsData[0] as GoalData
      setGoal(primaryGoal)

      // モンスターを取得
      const { data: monsterData } = await supabase
        .from('monsters')
        .select('id, name, stage, total_points, level')
        .eq('goal_id', primaryGoal.id)
        .single()

      if (!monsterData) { setLoading(false); return }
      setMonster(monsterData as MonsterData)

      // 能力値を取得
      const { data: statsData } = await supabase
        .from('monster_stats')
        .select('int_val, str_val, mnd_val, dex_val, cha_val')
        .eq('monster_id', monsterData.id)
        .single()

      setStats(statsData as StatsData ?? null)
      setLoading(false)
    }

    fetch()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-4xl mb-2">🐉</p>
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!monster || !goal) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen pb-20">
        <div className="text-center space-y-3">
          <p className="text-4xl">🥚</p>
          <p className="text-muted-foreground">モンスターが見つかりません</p>
          <Link href="/onboarding" className="text-emerald-600 text-sm underline">
            オンボーディングへ
          </Link>
        </div>
      </div>
    )
  }

  const table = getEvolutionTable(goal.course_type)
  const currentEntry = table.find((e) => e.stage === monster.stage)
  const nextEntry = table.find((e) => e.stage === monster.stage + 1)
  const currentRequired = currentEntry?.required_points ?? 0
  const nextRequired = nextEntry?.required_points ?? null
  const progressToNext = nextRequired
    ? Math.min(100, Math.round(((monster.total_points - currentRequired) / (nextRequired - currentRequired)) * 100))
    : 100

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            ← 戻る
          </Link>
          <span className="font-bold text-emerald-700">モンスター詳細</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ===== モンスターメイン表示 ===== */}
        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-6 text-center">
          {/* ステージバッジ */}
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">Stage {monster.stage}</Badge>
            <Badge className="bg-emerald-600 text-white text-xs">
              {currentEntry?.name ?? 'たまご'}
            </Badge>
          </div>

          {/* 絵文字（大） */}
          <div
            className="text-[7rem] leading-none mb-4 select-none mx-auto"
            style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }}
          >
            {getStageEmoji(monster.stage)}
          </div>

          {/* 名前 + レベル */}
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{monster.name}</h1>
          <p className="text-emerald-600 font-semibold text-lg mb-1">Lv.{monster.level}</p>
          <p className="text-xs text-muted-foreground mb-5">{goal.title}</p>

          {/* 経験値バー（レベル内進捗） */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>レベル経験値</span>
              <span>{monster.total_points % 100} / 100 pt</span>
            </div>
            <Progress value={(monster.total_points % 100)} className="h-2" />
          </div>

          {/* 進化までの進捗バー */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>次の進化まで</span>
              {nextRequired ? (
                <span>{monster.total_points} / {nextRequired} pt</span>
              ) : (
                <span className="text-emerald-600 font-semibold">🏆 最終形態！</span>
              )}
            </div>
            <Progress value={progressToNext} className="h-3" />
            {nextEntry && (
              <p className="text-xs text-muted-foreground text-center mt-1">
                あと {nextRequired! - monster.total_points} pt で「{nextEntry.name}」へ進化
              </p>
            )}
          </div>
        </div>

        {/* ===== 能力値 ===== */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">⚔️ 能力値</h2>
          {stats ? (
            <MonsterStats stats={stats} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              能力値データがありません
            </p>
          )}
        </div>

        {/* ===== 進化履歴（ステージマップ） ===== */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">🗺️ 進化ステージマップ</h2>
          <div className="space-y-2">
            {table.map((entry, idx) => {
              const reached = monster.stage >= entry.stage
              const isCurrent = monster.stage === entry.stage
              return (
                <div
                  key={entry.stage}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isCurrent
                      ? 'bg-emerald-50 border border-emerald-200'
                      : reached
                        ? 'bg-gray-50 border border-gray-100'
                        : 'opacity-40'
                    }`}
                >
                  {/* ステップ番号 */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCurrent
                        ? 'bg-emerald-500 text-white'
                        : reached
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                  >
                    {reached && !isCurrent ? '✓' : entry.stage}
                  </div>

                  {/* 絵文字 */}
                  <span className="text-2xl leading-none">{getStageEmoji(entry.stage)}</span>

                  {/* ステージ情報 */}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {entry.name}
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                          現在
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.required_points > 0 ? `${entry.required_points} pt〜` : '開始直後'}
                      {entry.duration_hint ? ` (${entry.duration_hint})` : ''}
                    </p>
                  </div>

                  {/* 接続線（最後以外） */}
                  {idx < table.length - 1 && (
                    <div className="absolute left-[2.75rem] mt-[3.5rem]" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ===== ダッシュボードに戻る ===== */}
        <Link
          href="/dashboard"
          className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-sm"
        >
          ダッシュボードに戻る
        </Link>
      </main>

      <BottomNav />
    </div>
  )
}
