import type { MonsterStage, CourseType } from '@/types'

// ============================================================
// 進化ステージの定義
// ============================================================

export type EvolutionStage = {
  stage: MonsterStage
  name: string
  required_points: number  // 進化に必要な累計ポイント
  duration_hint: string    // 期間の目安（表示用）
}

// ============================================================
// 1年コース: 7段階進化
// ============================================================
export const EVOLUTION_TABLE_1YEAR: readonly EvolutionStage[] = [
  { stage: 1, name: 'たまご',           required_points: 0,    duration_hint: '開始直後' },
  { stage: 2, name: 'ベビー',           required_points: 100,  duration_hint: '約10日' },
  { stage: 3, name: 'チャイルド',       required_points: 300,  duration_hint: '約1ヶ月' },
  { stage: 4, name: 'ジュニア',         required_points: 700,  duration_hint: '約2ヶ月' },
  { stage: 5, name: 'アダルト',         required_points: 1400, duration_hint: '約4ヶ月' },
  { stage: 6, name: 'エボリューション', required_points: 2500, duration_hint: '約7ヶ月' },
  { stage: 7, name: '最終形態',         required_points: 3650, duration_hint: '約1年' },
] as const

// ============================================================
// 3年コース: 11段階進化
// ============================================================
export const EVOLUTION_TABLE_3YEAR: readonly EvolutionStage[] = [
  { stage: 1,  name: 'たまご',               required_points: 0,     duration_hint: '開始直後' },
  { stage: 2,  name: 'ベビー',               required_points: 100,   duration_hint: '約10日' },
  { stage: 3,  name: 'チャイルド',           required_points: 300,   duration_hint: '約1ヶ月' },
  { stage: 4,  name: 'ジュニア',             required_points: 600,   duration_hint: '約2ヶ月' },
  { stage: 5,  name: 'アダルト',             required_points: 1100,  duration_hint: '約4ヶ月' },
  { stage: 6,  name: 'エボリューション',     required_points: 1900,  duration_hint: '約6ヶ月' },
  { stage: 7,  name: '最終形態 I',           required_points: 3000,  duration_hint: '約10ヶ月' },
  { stage: 8,  name: '最終形態 II',          required_points: 4500,  duration_hint: '約1年3ヶ月' },
  { stage: 9,  name: '最終形態 III',         required_points: 6500,  duration_hint: '約1年9ヶ月' },
  { stage: 10, name: '最終形態 IV',          required_points: 8500,  duration_hint: '約2年4ヶ月' },
  { stage: 11, name: '最終形態 V（究極体）', required_points: 10950, duration_hint: '約3年' },
] as const

// ============================================================
// ユーティリティ
// ============================================================

/** コースタイプに対応する進化テーブルを返す */
export function getEvolutionTable(courseType: CourseType): readonly EvolutionStage[] {
  return courseType === '1year' ? EVOLUTION_TABLE_1YEAR : EVOLUTION_TABLE_3YEAR
}

/** 累計ポイントから現在のステージを計算する */
export function calcStage(totalPoints: number, courseType: CourseType): MonsterStage {
  const table = getEvolutionTable(courseType)
  for (let i = table.length - 1; i >= 0; i--) {
    if (totalPoints >= table[i].required_points) {
      return table[i].stage
    }
  }
  return 1
}

/** 次のステージまでの残りポイントを返す（最終ステージなら null） */
export function pointsToNextStage(totalPoints: number, courseType: CourseType): number | null {
  const table = getEvolutionTable(courseType)
  const currentStage = calcStage(totalPoints, courseType)
  const nextEntry = table.find((e) => e.stage === currentStage + 1)
  if (!nextEntry) return null
  return nextEntry.required_points - totalPoints
}

/** コース表示用ラベル */
export const COURSE_LABEL: Record<CourseType, string> = {
  '1year': '1年コース（7段階進化）',
  '3year': '3年コース（11段階進化）',
}
