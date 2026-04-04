// ============================================================
// カテゴリ値のマッピング
// DB には英語値 ('learning','health',...)、UI には日本語値 ('学習','健康',...) を使用
// ============================================================

import type { GoalCategory } from '@/types'

/** UI表示用 日本語カテゴリ一覧 */
export const CATEGORY_LIST: GoalCategory[] = ['学習', '健康', '仕事', '生活', '趣味', 'その他']

/** GoalCategory (日本語) → DB 保存値 (英語) */
export const CATEGORY_TO_DB: Record<GoalCategory, string> = {
  '学習': 'learning',
  '健康': 'health',
  '仕事': 'work',
  '生活': 'lifestyle',
  '趣味': 'hobby',
  'その他': 'other',
}

/** DB 保存値 (英語) → GoalCategory (日本語) */
export const DB_TO_CATEGORY: Record<string, GoalCategory> = {
  'learning': '学習',
  'health': '健康',
  'work': '仕事',
  'lifestyle': '生活',
  'hobby': '趣味',
  'other': 'その他',
}

/** DB から読み込んだ category 文字列を GoalCategory に変換（未知値は 'その他' にフォールバック） */
export function dbToCategory(value: string | null | undefined): GoalCategory {
  if (!value) return 'その他'
  return DB_TO_CATEGORY[value] ?? (CATEGORY_LIST.includes(value as GoalCategory) ? value as GoalCategory : 'その他')
}
