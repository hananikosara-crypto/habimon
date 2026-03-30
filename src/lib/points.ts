// ============================================================
// ポイント計算 & モンスター更新ロジック
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { GoalCategory, CourseType, MonsterStage } from '@/types'
import { checkEvolution } from './evolution-check'
import { calcNewStreak } from './streak'

// ---- 定数 ----
export const BASE_POINTS = 10         // 習慣1回完了
export const COMPLETION_BONUS = 30    // その日の全習慣コンプリート
const STREAK_MILESTONES = [
  { days: 100, bonus: 100 },
  { days: 30, bonus: 50 },
  { days: 7, bonus: 20 },
] as const

// カテゴリ → 能力値カラム
const CATEGORY_STAT: Record<GoalCategory, string> = {
  '学習': 'int_val',
  '健康': 'str_val',
  '生活': 'mnd_val',
  '仕事': 'dex_val',
  '趣味': 'cha_val',
  'その他': 'mnd_val',
}

// ---- ユーティリティ ----

/** total_points からレベルを計算（最低1） */
export function calcLevel(totalPoints: number): number {
  return Math.max(1, Math.floor(totalPoints / 100))
}

/** 新ストリークに対するボーナスを計算 */
export function calcStreakBonus(newStreak: number): { bonus: number; milestone: number | null } {
  for (const m of STREAK_MILESTONES) {
    if (newStreak > 0 && newStreak % m.days === 0) {
      return { bonus: m.bonus, milestone: m.days }
    }
  }
  return { bonus: 0, milestone: null }
}

// ---- 戻り値の型 ----
export type CheckHabitResult = {
  pointsEarned: number
  completionBonus: boolean
  streakBonus: number
  streakMilestone: number | null
  evolved: boolean
  newStage: MonsterStage
  newTotalPoints: number
  newLevel: number
}

// ---- メイン関数 ----

/**
 * 習慣をチェックし、ポイント計算・DB 更新をまとめて行う
 *
 * @param supabase  ブラウザ Supabase クライアント
 * @param habitId   チェックする習慣 ID
 * @param userId    ログイン中ユーザー ID
 * @param monsterId 紐づくモンスター ID
 * @param category  習慣の目標カテゴリ（能力値更新に使用）
 * @param courseType  コース種別（進化判定に使用）
 * @param currentTotalPoints 現在のモンスター total_points
 * @param currentStage       現在のモンスターステージ
 * @param currentStreak      現在のストリーク日数
 * @param allHabitIds        今日の全習慣 ID 一覧
 * @param completedHabitIds  このチェック前に完了済みの習慣 ID 一覧
 */
export async function checkHabitAndUpdateMonster(params: {
  supabase: SupabaseClient
  habitId: string
  userId: string
  monsterId: string
  category: GoalCategory
  courseType: CourseType
  currentTotalPoints: number
  currentStage: MonsterStage
  currentStreak: number
  allHabitIds: string[]
  completedHabitIds: string[]
}): Promise<CheckHabitResult> {
  const {
    supabase, habitId, userId, monsterId,
    category, courseType,
    currentTotalPoints, currentStage, currentStreak,
    allHabitIds, completedHabitIds,
  } = params

  // ---- ポイント計算 ----
  let pointsEarned = BASE_POINTS

  // コンプリートボーナス: この習慣を完了すると全タスク達成になるか
  const completedAfter = new Set([...completedHabitIds, habitId])
  const completionBonus = allHabitIds.length > 0 && allHabitIds.every((id) => completedAfter.has(id))
  if (completionBonus) pointsEarned += COMPLETION_BONUS

  // ストリークボーナス: 今日初めての完了時のみ判定
  const isFirstCompletionToday = completedHabitIds.length === 0
  const newStreak = calcNewStreak(currentStreak, !isFirstCompletionToday)
  const { bonus: streakBonus, milestone: streakMilestone } = isFirstCompletionToday
    ? calcStreakBonus(newStreak)
    : { bonus: 0, milestone: null }
  pointsEarned += streakBonus

  const newTotalPoints = currentTotalPoints + pointsEarned
  const newLevel = calcLevel(newTotalPoints)

  // ---- 進化チェック ----
  const { evolved, newStage } = checkEvolution(newTotalPoints, currentStage, courseType)

  // ---- DB 更新（並列実行） ----
  const statCol = CATEGORY_STAT[category]

  // 1. habit_logs に記録
  const insertLog = supabase.from('habit_logs').insert({
    habit_id: habitId,
    user_id: userId,
    completed_at: new Date().toISOString(),
    points_earned: pointsEarned,
  })

  // 2. monsters テーブル更新
  const updateMonster = supabase
    .from('monsters')
    .update({ total_points: newTotalPoints, level: newLevel, stage: newStage })
    .eq('id', monsterId)

  await Promise.all([insertLog, updateMonster])

  // 3. monster_stats 更新（読み取り→+1）
  const { data: stats } = await supabase
    .from('monster_stats')
    .select('id, int_val, str_val, mnd_val, dex_val, cha_val')
    .eq('monster_id', monsterId)
    .single()

  if (stats) {
    const currentVal = (stats[statCol as keyof typeof stats] as number) ?? 1
    await supabase
      .from('monster_stats')
      .update({ [statCol]: currentVal + 1 })
      .eq('id', stats.id)
  }

  return {
    pointsEarned,
    completionBonus,
    streakBonus,
    streakMilestone,
    evolved,
    newStage,
    newTotalPoints,
    newLevel,
  }
}
