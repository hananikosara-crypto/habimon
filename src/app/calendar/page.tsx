'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dbToCategory } from '@/lib/categories'
import type { GoalCategory, HabitFrequency, HabitStatus } from '@/types'

type HabitRow = {
  id: string
  title: string
  category: string | null
  frequency: HabitFrequency
}

type LogRow = {
  habit_id: string
  completed_at: string
  status: HabitStatus
}

// 日付ごとの達成状況
type DayStatus = 'future' | 'empty' | 'partial' | 'full'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const STATUS_DOT: Record<Exclude<DayStatus, 'future'>, string> = {
  full: '🟢',
  partial: '🟡',
  empty: '🔴',
}

const STATUS_BG: Record<DayStatus, string> = {
  full: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  partial: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  empty: 'bg-red-50 border-red-200 text-red-700',
  future: 'bg-white border-border text-muted-foreground',
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())  // 0-indexed

  const [habits, setHabits] = useState<HabitRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  // モーダル
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 未ログインリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth')
    }
  }, [user, authLoading, router])

  // データ取得（対象月の logs + 全習慣）
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // 習慣を取得
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const goalIds = (goalsData ?? []).map(g => g.id)

      if (goalIds.length > 0) {
        const { data: habitsData } = await supabase
          .from('habits')
          .select('id, title, category, frequency')
          .in('goal_id', goalIds)
          .eq('user_id', user.id)
          .eq('is_active', true)
        setHabits(habitsData ?? [])
      } else {
        setHabits([])
      }

      // 対象月全体のログを取得（completed_at は date 型 = YYYY-MM-DD）
      const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDayNum = new Date(year, month + 1, 0).getDate()
      const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`

      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_at, status')
        .eq('user_id', user.id)
        .gte('completed_at', firstDayStr)
        .lte('completed_at', lastDayStr)

      setLogs(
        (logsData ?? []).map(l => ({
          ...l,
          status: (l.status ?? 'completed') as HabitStatus,
        }))
      )
    } catch (err) {
      console.error('[calendar] fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, year, month, supabase])

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [user, authLoading, fetchData])

  // 月移動
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ログを日付ごとに集計
  const logsByDate: Record<string, LogRow[]> = {}
  for (const log of logs) {
    const dateStr = log.completed_at.slice(0, 10)
    if (!logsByDate[dateStr]) logsByDate[dateStr] = []
    logsByDate[dateStr].push(log)
  }

  const todayStr = today.toISOString().slice(0, 10)

  function getDayStatus(dateStr: string): DayStatus {
    if (dateStr > todayStr) return 'future'
    const dayLogs = logsByDate[dateStr] ?? []
    const completedHabitIds = new Set(
      dayLogs.filter(l => l.status === 'completed').map(l => l.habit_id)
    )
    const totalHabits = habits.length
    if (totalHabits === 0) return 'empty'
    if (completedHabitIds.size === 0) return 'empty'
    if (completedHabitIds.size >= totalHabits) return 'full'
    return 'partial'
  }

  // カレンダーグリッドの日付生成
  const firstDayOfMonth = new Date(year, month, 1).getDay()  // 0=日
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarCells: (string | null)[] = [
    ...Array(firstDayOfMonth).fill(null),  // 空白セル
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }),
  ]
  // 6週分に揃える
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  // モーダル用：選択日のデータ
  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : []
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <span className="font-bold text-emerald-700 text-lg">📅 カレンダー</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-border p-3 shadow-sm">
          <Button variant="outline" size="sm" onClick={prevMonth}>← 前月</Button>
          <span className="font-bold text-gray-800">{year}年 {month + 1}月</span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            disabled={year === today.getFullYear() && month === today.getMonth()}
          >
            次月 →
          </Button>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span>🟢 全完了</span>
          <span>🟡 一部完了</span>
          <span>🔴 未完了</span>
          <span className="text-gray-300">⬜ 未来</span>
        </div>

        {/* カレンダーグリッド */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-semibold py-2
                  ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 日付セル */}
          <div className="grid grid-cols-7">
            {calendarCells.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="h-12 border-b border-r border-border/40 last:border-r-0" />
              }
              const status = getDayStatus(dateStr)
              const dayNum = parseInt(dateStr.split('-')[2])
              const isToday = dateStr === todayStr
              const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => status !== 'future' ? setSelectedDate(dateStr) : undefined}
                  disabled={status === 'future'}
                  className={`h-12 border-b border-r border-border/40 last:border-r-0 flex flex-col items-center justify-center gap-0.5 transition-all
                    ${status !== 'future' ? 'hover:opacity-70 active:scale-95 cursor-pointer' : 'cursor-default'}
                    ${isToday ? 'ring-2 ring-inset ring-emerald-500' : ''}
                  `}
                >
                  <span className={`text-xs font-semibold leading-none
                    ${isToday ? 'text-emerald-600' : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'}`}
                  >
                    {dayNum}
                  </span>
                  {status !== 'future' && (
                    <span className="text-[10px] leading-none">
                      {STATUS_DOT[status as Exclude<DayStatus, 'future'>]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 月間サマリー */}
        {habits.length > 0 && (() => {
          const pastDays = calendarCells.filter(d => d && d <= todayStr && d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
          const fullDays = pastDays.filter(d => d && getDayStatus(d) === 'full').length
          const partialDays = pastDays.filter(d => d && getDayStatus(d) === 'partial').length
          return (
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">今月の集計</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-emerald-600">{fullDays}</p>
                  <p className="text-xs text-muted-foreground">全完了日</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-yellow-500">{partialDays}</p>
                  <p className="text-xs text-muted-foreground">一部完了日</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-400">{pastDays.length}</p>
                  <p className="text-xs text-muted-foreground">経過日数</p>
                </div>
              </div>
            </div>
          )
        })()}
      </main>

      <BottomNav />

      {/* ========== 日付詳細モーダル ========== */}
      {selectedDate && selectedDateObj && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-5 pb-8 shadow-2xl max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base">
                {selectedDateObj.getFullYear()}年{selectedDateObj.getMonth() + 1}月{selectedDateObj.getDate()}日
                <span className="ml-2 text-sm text-muted-foreground">
                  （{DAY_LABELS[selectedDateObj.getDay()]}）
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-muted-foreground hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>

            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">習慣が登録されていません</p>
            ) : (
              <ul className="space-y-2">
                {habits.map(habit => {
                  const log = selectedLogs.find(l => l.habit_id === habit.id)
                  const status = log?.status ?? null
                  const cat = dbToCategory(habit.category) as GoalCategory

                  return (
                    <li key={habit.id} className={`flex items-center gap-3 p-3 rounded-xl border
                      ${status === 'completed'
                        ? 'bg-emerald-50 border-emerald-200'
                        : status === 'skipped'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="text-xl">
                        {status === 'completed' ? '✅' : status === 'skipped' ? '❌' : '⬜'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate
                          ${status ? 'text-gray-700' : 'text-gray-400'}`}
                        >
                          {habit.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {status === 'completed' ? '完了' : status === 'skipped' ? 'スキップ' : '未記録'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {cat}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
