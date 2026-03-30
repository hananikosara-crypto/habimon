'use client'

import { Badge } from '@/components/ui/badge'
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

type HabitListProps = {
  habits: HabitItem[]
  onToggle?: (habitId: string) => void
}

export default function HabitList({ habits, onToggle }: HabitListProps) {
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
        {habits.map((habit) => (
          <li key={habit.id}>
            <button
              type="button"
              onClick={() => onToggle?.(habit.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                ${habit.completed
                  ? 'bg-emerald-50 border-emerald-200 opacity-70'
                  : 'bg-white border-border hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
            >
              {/* チェックサークル */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${habit.completed
                    ? 'bg-emerald-500 border-emerald-500'
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
        ))}
      </ul>
    </div>
  )
}
