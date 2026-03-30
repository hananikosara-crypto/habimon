import type { MonsterStage } from '@/types'

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
// 習慣完了 10pt/日 として約 365日 = ~3,650pt が上限目安
// ============================================================
export const EVOLUTION_TABLE_1YEAR: readonly EvolutionStage[] = [
  {
    stage: 1,
    name: 'たまご',
    required_points: 0,
    duration_hint: '開始直後',
  },
  {
    stage: 2,
    name: 'ベビー',
    required_points: 100,       // 約10日
    duration_hint: '約10日',
  },
  {
    stage: 3,
    name: 'チャイルド',
    required_points: 300,       // 約1ヶ月
    duration_hint: '約1ヶ月',
  },
  {
    stage: 4,
    name: 'ジュニア',
    required_points: 700,       // 約2ヶ月
    duration_hint: '約2ヶ月',
  },
  {
    stage: 5,
    name: 'アダルト',
    required_points: 1400,      // 約4ヶ月
    duration_hint: '約4ヶ月',
  },
  {
    stage: 6,
    name: 'エボリューション',
    required_points: 2500,      // 約7ヶ月
    duration_hint: '約7ヶ月',
  },
  {
    stage: 7,
    name: '最終形態',
    required_points: 3650,      // 約1年
    duration_hint: '約1年',
  },
] as const

// ============================================================
// 3年コース: 11段階進化
// 習慣完了 10pt/日 として約 1,095日 = ~10,950pt が上限目安
// ============================================================
export const EVOLUTION_TABLE_3YEAR: readonly EvolutionStage[] = [
  {
    stage: 1,
    name: 'たまご',
    required_points: 0,
    duration_hint: '開始直後',
  },
  {
    stage: 2,
    name: 'ベビー',
    required_points: 100,       // 約10日
    duration_hint: '約10日',
  },
  {
    stage: 3,
    name: 'チャイルド',
    required_points: 300,       // 約1ヶ月
    duration_hint: '約1ヶ月',
  },
  {
    stage: 4,
    name: 'ジュニア',
    required_points: 600,       // 約2ヶ月
    duration_hint: '約2ヶ月',
  },
  {
    stage: 5,
    name: 'アダルト',
    required_points: 1100,      // 約4ヶ月
    duration_hint: '約4ヶ月',
  },
  {
    stage: 6,
    name: 'エボリューション',
    required_points: 1900,      // 約6ヶ月
    duration_hint: '約6ヶ月',
  },
  {
    stage: 7,
    name: '最終形態 I',
    required_points: 3000,      // 約10ヶ月
    duration_hint: '約10ヶ月',
  },
  {
    stage: 8,
    name: '最終形態 II',
    required_points: 4500,      // 約1年3ヶ月
    duration_hint: '約1年3ヶ月',
  },
  {
    stage: 9,
    name: '最終形態 III',
    required_points: 6500,      // 約1年9ヶ月
    duration_hint: '約1年9ヶ月',
  },
  {
    stage: 10,
    name: '最終形態 IV',
    required_points: 8500,      // 約2年4ヶ月
    duration_hint: '約2年4ヶ月',
  },
  {
    stage: 11,
    name: '最終形態 V（究極体）',
    required_points: 10950,     // 約3年
    duration_hint: '約3年',
  },
] as const

// ============================================================
// ユーティリティ
// ============================================================

/**
 * コースタイプに対応する進化テーブルを返す
 */
export function getEvolutionTable(courseType: '1年' | '3年'): readonly EvolutionStage[] {
  return courseType === '1年' ? EVOLUTION_TABLE_1YEAR : EVOLUTION_TABLE_3YEAR
}

/**
 * 累計ポイントから現在のステージを計算する
 */
export function calcStage(totalPoints: number, courseType: '1年' | '3年'): MonsterStage {
  const table = getEvolutionTable(courseType)
  // 後ろから走査して、必要ポイントを超えた最初のステージを返す
  for (let i = table.length - 1; i >= 0; i--) {
    if (totalPoints >= table[i].required_points) {
      return table[i].stage
    }
  }
  return 1
}

/**
 * 次のステージまでの残りポイントを返す（最終ステージなら null）
 */
export function pointsToNextStage(
  totalPoints: number,
  courseType: '1年' | '3年'
): number | null {
  const table = getEvolutionTable(courseType)
  const currentStage = calcStage(totalPoints, courseType)
  const nextEntry = table.find((e) => e.stage === currentStage + 1)
  if (!nextEntry) return null
  return nextEntry.required_points - totalPoints
}
