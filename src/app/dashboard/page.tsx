'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { checkHabitAndUpdateMonster } from '@/lib/points'
import { calcStreak } from '@/lib/streak'
import { getEvolutionTable } from '@/constants/evolution'
import MonsterDisplay from '@/components/MonsterDisplay'
import HabitList, { type HabitItem } from '@/components/HabitList'
import StatusCards from '@/components/StatusCards'
import BottomNav from '@/components/BottomNav'
import EvolutionAnimation from '@/components/EvolutionAnimation'
import DebugPanel from '@/components/DebugPanel'
import { Button } from '@/components/ui/button'
import type { GoalCategory, CourseType, HabitFrequency, MonsterStage } from '@/types'

// DB から返る行の型
type GoalRow = {
  id: string
  title: string
  category: GoalCategory
  course_type: CourseType
  status: string
}

type MonsterRow = {
  id: string
  goal_id: string
  name: string
  stage: MonsterStage
  total_points: number
  level: number
}

type HabitRow = {
  id: string
  goal_id: string
  title: string
  frequency: HabitFrequency
  category: GoalCategory | null  // 習慣ごとのカテゴリ
}

type HabitLogRow = {
  id: string
  habit_id: string
  completed_at: string
  points_earned: number
}

// ========== メインページ ==========
export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  // supabase インスタンスを ref で保持（useCallback の依存から外す）
  const supabaseRef = useRef(supabase)

  // データ状態
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [monster, setMonster] = useState<MonsterRow | null>(null)
  const [habits, setHabits] = useState<HabitRow[]>([])
  const [todayLogs, setTodayLogs] = useState<HabitLogRow[]>([])
  const [allLogs, setAllLogs] = useState<HabitLogRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // 進化演出
  type EvolutionInfo = {
    monsterName: string
    oldStage: MonsterStage
    newStage: MonsterStage
    oldStageName: string
    newStageName: string
  }
  const [evolutionInfo, setEvolutionInfo] = useState<EvolutionInfo | null>(null)

  // 未ログインリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth')
    }
  }, [user, authLoading, router])

  // データ取得
  const fetchData = useCallback(async () => {
    if (!user) return
    const sb = supabaseRef.current
    setDataLoading(true)

    try {
      // 1. アクティブな目標を取得
      const { data: goalsData } = await sb
        .from('goals')
        .select('id, title, category, course_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const activeGoals: GoalRow[] = goalsData ?? []
      setGoals(activeGoals)

      if (activeGoals.length === 0) {
        router.replace('/onboarding')
        return
      }

      const goalIds = activeGoals.map((g) => g.id)

      // 2. 最初の目標に紐づくモンスターを取得
      const { data: monsterData } = await sb
        .from('monsters')
        .select('id, goal_id, name, stage, total_points, level')
        .eq('goal_id', activeGoals[0].id)
        .single()

      setMonster(monsterData ?? null)

      // 3. 習慣を取得（category を含む）
      const { data: habitsData } = await sb
        .from('habits')
        .select('id, goal_id, title, frequency, category')
        .in('goal_id', goalIds)
        .eq('user_id', user.id)

      setHabits(habitsData ?? [])

      // 4. 今日の habit_logs を取得
      const todayStr = new Date().toISOString().slice(0, 10)
      const { data: todayLogsData } = await sb
        .from('habit_logs')
        .select('id, habit_id, completed_at, points_earned')
        .eq('user_id', user.id)
        .gte('completed_at', `${todayStr}T00:00:00`)
        .lte('completed_at', `${todayStr}T23:59:59.999`)

      setTodayLogs(todayLogsData ?? [])

      // 5. 過去 60 日分のログ（ストリーク計算用）
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      const { data: allLogsData } = await sb
        .from('habit_logs')
        .select('id, habit_id, completed_at, points_earned')
        .eq('user_id', user.id)
        .gte('completed_at', sixtyDaysAgo.toISOString())

      setAllLogs(allLogsData ?? [])
    } finally {
      setDataLoading(false)
    }
  }, [user, router])

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [user, authLoading, fetchData])

  // ========== 習慣チェック処理 ==========
  const handleCheck = useCallback(async (habitId: string): Promise<number | null> => {
    if (!user || !monster) return null

    const primaryGoal = goals[0]
    if (!primaryGoal) return null

    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return null

    // 完了済みチェック（二重防止）
    if (todayLogs.some((log) => log.habit_id === habitId)) return null

    const allHabitIds = habits.map((h) => h.id)
    const completedHabitIds = todayLogs.map((log) => log.habit_id)
    const currentStreak = calcStreak(allLogs)
    const currentStage = monster.stage  // 進化前ステージ（演出用に保存）

    try {
      const result = await checkHabitAndUpdateMonster({
        supabase: supabaseRef.current,
        habitId,
        userId: user.id,
        monsterId: monster.id,
        category: habit.category ?? 'その他',  // 習慣ごとのカテゴリを使用
        courseType: primaryGoal.course_type,
        currentTotalPoints: monster.total_points,
        currentStage,
        currentStreak,
        allHabitIds,
        completedHabitIds,
      })

      // ローカル状態を楽観的に更新
      const newLog: HabitLogRow = {
        id: `temp-${Date.now()}`,
        habit_id: habitId,
        completed_at: new Date().toISOString(),
        points_earned: result.pointsEarned,
      }
      setTodayLogs((prev) => [...prev, newLog])
      setAllLogs((prev) => [...prev, newLog])
      setMonster((prev) =>
        prev
          ? { ...prev, total_points: result.newTotalPoints, level: result.newLevel, stage: result.newStage }
          : prev
      )

      // 進化した場合：演出を表示してから再フェッチ
      if (result.evolved) {
        const table = getEvolutionTable(primaryGoal.course_type)
        const oldEntry = table.find((e) => e.stage === currentStage)
        const newEntry = table.find((e) => e.stage === result.newStage)
        setEvolutionInfo({
          monsterName: monster.name,
          oldStage: currentStage,
          newStage: result.newStage,
          oldStageName: oldEntry?.name ?? 'たまご',
          newStageName: newEntry?.name ?? 'ベビー',
        })
      }

      return result.pointsEarned
    } catch (err) {
      console.error('習慣チェックエラー:', err)
      return null
    }
  }, [user, monster, goals, habits, todayLogs, allLogs, fetchData])

  // デバッグ用：進化演出を強制発動
  const handleTriggerEvolution = useCallback((oldStage: MonsterStage, newStage: MonsterStage) => {
    if (!monster) return
    const primaryGoal = goals[0]
    if (!primaryGoal) return
    const table = getEvolutionTable(primaryGoal.course_type)
    const oldEntry = table.find((e) => e.stage === oldStage)
    const newEntry = table.find((e) => e.stage === newStage)
    setEvolutionInfo({
      monsterName: monster.name,
      oldStage,
      newStage,
      oldStageName: oldEntry?.name ?? 'たまご',
      newStageName: newEntry?.name ?? 'ベビー',
    })
  }, [monster, goals])

  // サインアウト
  const handleSignOut = async () => {
    await signOut()
    router.replace('/auth')
  }

  // ローディング
  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-4xl mb-2">🥚</p>
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ========== 派生データ計算 ==========
  const completedHabitIds = new Set(todayLogs.map((log) => log.habit_id))

  const todayHabits: HabitItem[] = habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    frequency: habit.frequency,
    category: habit.category ?? 'その他',  // 習慣ごとのカテゴリ
    completed: completedHabitIds.has(habit.id),
  }))

  const totalToday = todayHabits.length
  const completedToday = todayHabits.filter((h) => h.completed).length
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const streak = calcStreak(allLogs)
  const totalPoints = monster?.total_points ?? 0
  const level = monster?.level ?? 1
  const primaryGoal = goals[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ========== 進化演出モーダル ========== */}
      {evolutionInfo && (
        <EvolutionAnimation
          monsterName={evolutionInfo.monsterName}
          oldStage={evolutionInfo.oldStage}
          newStage={evolutionInfo.newStage}
          oldStageName={evolutionInfo.oldStageName}
          newStageName={evolutionInfo.newStageName}
          onClose={() => {
            setEvolutionInfo(null)
            fetchData()  // 演出後にデータ再取得
          }}
        />
      )}

      {/* ========== ヘッダー ========== */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥚</span>
            <span className="font-bold text-emerald-700 text-lg">HabiMon</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* ========== メインコンテンツ ========== */}
      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* 目標タイトル */}
        {primaryGoal && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">現在の目標</p>
            <h2 className="text-base font-semibold text-gray-800 truncate">{primaryGoal.title}</h2>
          </div>
        )}

        {/* モンスター表示エリア */}
        {monster ? (
          <MonsterDisplay
            name={monster.name}
            stage={monster.stage}
            totalPoints={monster.total_points}
            level={monster.level}
            courseType={primaryGoal?.course_type ?? '1年'}
          />
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-4xl mb-2">🥚</p>
            <p className="text-sm">モンスターが見つかりません</p>
          </div>
        )}

        {/* ステータスカード */}
        <StatusCards
          streak={streak}
          totalPoints={totalPoints}
          level={level}
          completionRate={completionRate}
        />

        {/* 今日のタスクリスト */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <HabitList
            habits={todayHabits}
            onCheck={handleCheck}
          />
        </div>

        {goals.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            他に {goals.length - 1} 件の目標があります
          </p>
        )}
      </main>

      <BottomNav />

      {/* ========== デバッグパネル（開発環境のみ） ========== */}
      {monster && (
        <DebugPanel
          monsterId={monster.id}
          monsterName={monster.name}
          userId={user!.id}
          habitIds={habits.map((h) => h.id)}
          currentStage={monster.stage}
          currentPoints={monster.total_points}
          courseType={primaryGoal?.course_type ?? '1年'}
          onRefresh={fetchData}
          onTriggerEvolution={handleTriggerEvolution}
        />
      )}
    </div>
  )
}
