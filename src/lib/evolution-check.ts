// ============================================================
// 進化判定ロジック
// ============================================================

import { calcStage } from '@/constants/evolution'
import type { CourseType, MonsterStage } from '@/types'

export type EvolutionCheckResult = {
  evolved: boolean
  newStage: MonsterStage
  oldStage: MonsterStage
}

/**
 * 新しい合計ポイントと現在のステージから進化するかを判定する
 * DB の更新は points.ts の checkHabitAndUpdateMonster で行う
 */
export function checkEvolution(
  newTotalPoints: number,
  currentStage: MonsterStage,
  courseType: CourseType
): EvolutionCheckResult {
  const newStage = calcStage(newTotalPoints, courseType)
  return {
    evolved: newStage > currentStage,
    newStage,
    oldStage: currentStage,
  }
}
