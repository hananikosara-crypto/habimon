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
  goalCategory: GoalCategory
  completed: boolean
}

type FloatAnimation = {
  points: number
  animKey: number  // 再発火させるためのユニークキー
}

type HabitListProps = {
  habits: HabitItem[]
  /**
   * チェック時に呼ばれる非同期コールバック
   * 戻り値: 獲得ポイント数（すでに完了 or エラーなら null）
   */
  onCheck?: (habitId: string) => Promise<number | null>
}

export default function HabitList({ habits, onCheck }: HabitListProps) {
  // ローディング中の習慣 ID
  const [checking, setChecking] = useState<Set<string>>(new Set())
  // フローティングアニメーション状態
  const [floats, setFloats] = useState<Map<string, FloatAnimation>>(new Map())

  const handleClick = useCallback(async (habit: HabitItem) => {
    if (habit.completed) return           // 完了済みは何もしない
    if (checking.has(habit.id)) return    // 処理中は重複防止

    setChecking((prev) => new Set(prev).add(habit.id))

    const points = await onCheck?.(habit.id) ?? null

    setChecking((prev) => {
      const next = new Set(prev)
      next.delete(habit.id)
      return next
    })

    if (points !== null && points > 0) {
      // フローティングアニメーションを起動
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
  }, [checking, onCheck])

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
          const float = floats.get(habit.id)

          return (
            <li key={habit.id} className="relative">
              {/* ポイント獲得フローティング表示 */}
              {float && (
                <div
                  key={float.animKey}
                  className="animate-float-up absolute right-3 top-1 z-10 text-emerald-600 font-bold text-sm select-none"
                >
                  +{float.points}pt
                </div>
              )}

              <button
                type="button"
                onClick={() => handleClick(habit)}
                disabled={habit.completed || isChecking}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${habit.completed
                    ? 'bg-emerald-50 border-emerald-200 opacity-60 cursor-default'
                    : isChecking
                      ? 'bg-gray-50 border-gray-200 cursor-wait'
                      : 'bg-white border-border hover:border-emerald-300 hover:bg-emerald-50/50 active:scale-[0.98]'
                  }`}
              >
                {/* チェックサークル */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${habit.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : isChecking
                        ? 'border-gray-300 animate-pulse'
                        : 'border-gray-300'
                    }`}
                >
                  {habit.completed && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isChecking && !habit.completed && (
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-ping" />
                  )}
                </div>

                {/* 習慣情報 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate
                      ${habit.completed ? 'line-through text-muted-foreground' : 'text-gray-800'}`}
                  >
                    {habit.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {FREQUENCY_LABEL[habit.frequency]}
                  </p>
                </div>

                {/* カテゴリバッジ */}
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                    ${CATEGORY_COLOR[habit.goalCategory]}`}
                >
                  {habit.goalCategory}
                </span>
              </button>
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
