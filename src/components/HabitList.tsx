'use client'

import { useState, useCallback } from 'react'
import type { GoalCategory, HabitFrequency } from '@/types'

// カテゴリ別カラー
const CATEGORY_COLOR: Record<GoalCategory, string> = {
  '学習': 'bg-blue-100 text-blue-700',
  '健康': 'bg-green-100 text-green-700',
  '仕事': 'bg-orange-100 text-orange-700',
  '生活': 'bg-purple-100 text-purple-700',
  '趣味': 'bg-pink-100 text-pink-700',
  'その他': 'bg-gray-100 text-gray-600',
}

const FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  '毎日': '毎日',
  '週次': '週1回',
  'カスタム': 'カスタム',
}

export type HabitItem = {
  id: string
  title: string
  frequency: HabitFrequency
  category: GoalCategory
  completed: boolean  // 完了済み（ポイント獲得）
  skipped: boolean    // スキップ済み（記録のみ）
}

type FloatAnimation = {
  points: number
  animKey: number
}

type HabitListProps = {
  habits: HabitItem[]
  /** 完了ボタン押下: 戻り値 = 獲得ポイント数（エラー時 null） */
  onCheck?: (habitId: string) => Promise<number | null>
  /** スキップボタン押下 */
  onSkip?: (habitId: string) => Promise<void>
}

export default function HabitList({ habits, onCheck, onSkip }: HabitListProps) {
  const [checking, setChecking] = useState<Set<string>>(new Set())
  const [skipping, setSkipping] = useState<Set<string>>(new Set())
  const [floats, setFloats] = useState<Map<string, FloatAnimation>>(new Map())

  const handleComplete = useCallback(async (habit: HabitItem) => {
    if (habit.completed || habit.skipped) return
    if (checking.has(habit.id) || skipping.has(habit.id)) return

    setChecking((prev) => new Set(prev).add(habit.id))
    const points = await onCheck?.(habit.id) ?? null
    setChecking((prev) => {
      const next = new Set(prev)
      next.delete(habit.id)
      return next
    })

    if (points !== null && points > 0) {
      const animKey = Date.now()
      setFloats((prev) => new Map(prev).set(habit.id, { points, animKey }))
      setTimeout(() => {
        setFloats((prev) => {
          const next = new Map(prev)
          next.delete(habit.id)
          return next
        })
      }, 1400)
    }
  }, [checking, skipping, onCheck])

  const handleSkip = useCallback(async (habit: HabitItem) => {
    if (habit.completed || habit.skipped) return
    if (checking.has(habit.id) || skipping.has(habit.id)) return

    setSkipping((prev) => new Set(prev).add(habit.id))
    await onSkip?.(habit.id)
    setSkipping((prev) => {
      const next = new Set(prev)
      next.delete(habit.id)
      return next
    })
  }, [checking, skipping, onSkip])

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm">今日のタスクはありません</p>
      </div>
    )
  }

  const completed = habits.filter((h) => h.completed).length
  const total = habits.length

  return (
    <div className="space-y-3">
      {/* 完了率ヘッダー */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">今日のタスク</span>
        <span className="text-muted-foreground">
          {completed} / {total} 完了
        </span>
      </div>

      {/* 習慣リスト */}
      <ul className="space-y-2">
        {habits.map((habit) => {
          const isChecking = checking.has(habit.id)
          const isSkipping = skipping.has(habit.id)
          const isBusy = isChecking || isSkipping
          const isLogged = habit.completed || habit.skipped
          const float = floats.get(habit.id)

          return (
            <li key={habit.id} className="relative">
              {/* ポイント獲得フローティング */}
              {float && (
                <div
                  key={float.animKey}
                  className="animate-float-up absolute right-3 top-1 z-10 text-emerald-600 font-bold text-sm select-none"
                >
                  +{float.points}pt
                </div>
              )}

              <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                ${habit.completed
                  ? 'bg-emerald-50 border-emerald-200'
                  : habit.skipped
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-border'
                }`}
              >
                {/* ステータスアイコン */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
                  ${habit.completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : habit.skipped
                      ? 'bg-red-400 border-red-400'
                      : isBusy
                        ? 'border-gray-300 animate-pulse'
                        : 'border-gray-300'
                  }`}
                >
                  {habit.completed && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {habit.skipped && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {isBusy && !isLogged && (
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-ping" />
                  )}
                </div>

                {/* 習慣情報 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate
                    ${habit.completed
                      ? 'line-through text-muted-foreground'
                      : habit.skipped
                        ? 'line-through text-muted-foreground/70'
                        : 'text-gray-800'
                    }`}
                  >
                    {habit.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{FREQUENCY_LABEL[habit.frequency]}</span>
                    {habit.completed && <span className="text-xs text-emerald-600 font-medium">✓ 完了</span>}
                    {habit.skipped && <span className="text-xs text-red-500 font-medium">× スキップ</span>}
                  </div>
                </div>

                {/* カテゴリバッジ */}
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[habit.category]}`}>
                  {habit.category}
                </span>

                {/* アクションボタン（未記録のみ表示） */}
                {!isLogged && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* 完了ボタン */}
                    <button
                      type="button"
                      onClick={() => handleComplete(habit)}
                      disabled={isBusy}
                      title="完了"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${isBusy
                          ? 'bg-gray-100 text-gray-300 cursor-wait'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white active:scale-95'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    {/* スキップボタン */}
                    <button
                      type="button"
                      onClick={() => handleSkip(habit)}
                      disabled={isBusy}
                      title="スキップ"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${isBusy
                          ? 'bg-gray-100 text-gray-300 cursor-wait'
                          : 'bg-red-100 text-red-500 hover:bg-red-400 hover:text-white active:scale-95'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* 全完了メッセージ */}
      {completed === total && total > 0 && (
        <div className="text-center py-3 text-sm text-emerald-600 font-semibold">
          🎉 今日のタスクを全部完了！ 素晴らしい！
        </div>
      )}
    </div>
  )
}
