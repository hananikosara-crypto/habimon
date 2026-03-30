'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { EVOLUTION_TABLE_1YEAR, EVOLUTION_TABLE_3YEAR } from '@/constants/evolution'
import type { MonsterStage, CourseType } from '@/types'

// ステージ → 絵文字マッピング
const STAGE_EMOJI: Record<number, string> = {
  1: '🥚',
  2: '🐣',
  3: '🐥',
  4: '🐤',
  5: '🦆',
  6: '🦅',
  7: '🐉',
  8: '🔥',
  9: '⚡',
  10: '🌟',
  11: '✨',
}

type MonsterDisplayProps = {
  name: string
  stage: MonsterStage
  totalPoints: number
  level: number
  courseType: CourseType
}

export default function MonsterDisplay({
  name,
  stage,
  totalPoints,
  level,
  courseType,
}: MonsterDisplayProps) {
  const table = courseType === '1年' ? EVOLUTION_TABLE_1YEAR : EVOLUTION_TABLE_3YEAR
  const currentEntry = table.find((e) => e.stage === stage)
  const nextEntry = table.find((e) => e.stage === stage + 1)

  // 次進化までの進捗計算
  const currentRequired = currentEntry?.required_points ?? 0
  const nextRequired = nextEntry?.required_points ?? null
  const progressToNext = nextRequired
    ? Math.min(100, Math.round(((totalPoints - currentRequired) / (nextRequired - currentRequired)) * 100))
    : 100

  const emoji = STAGE_EMOJI[stage] ?? '🥚'
  const stageName = currentEntry?.name ?? 'たまご'

  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
      {/* ステージバッジ */}
      <div className="flex gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">
          Stage {stage}
        </Badge>
        <Badge className="bg-emerald-600 text-white text-xs">
          {stageName}
        </Badge>
      </div>

      {/* モンスター絵文字 */}
      <div
        className="text-8xl mb-3 select-none"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}
      >
        {emoji}
      </div>

      {/* モンスター名 + レベル */}
      <h2 className="text-xl font-bold text-gray-800 mb-1">{name}</h2>
      <p className="text-sm text-emerald-600 font-semibold mb-4">Lv.{level}</p>

      {/* 次の進化までの進捗バー */}
      <div className="w-full max-w-xs space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>次の進化まで</span>
          {nextRequired ? (
            <span>{totalPoints} / {nextRequired} pt</span>
          ) : (
            <span>最終形態！</span>
          )}
        </div>
        <Progress value={progressToNext} className="h-3" />
        {nextEntry && (
          <p className="text-xs text-center text-muted-foreground">
            あと {nextRequired! - totalPoints} pt で「{nextEntry.name}」に進化
          </p>
        )}
      </div>
    </div>
  )
}
