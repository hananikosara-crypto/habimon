// ============================================================
// HabiMon 基本型定義 — v3 (DB値は英語)
// ============================================================

// ユーザー
export type User = {
  id: string
  email: string
  display_name: string
  created_at: string
  updated_at: string
}

// カテゴリ (UI表示用 日本語)
export type GoalCategory = '学習' | '健康' | '仕事' | '生活' | '趣味' | 'その他'

// コースタイプ (DB値)
export type CourseType = '1year' | '3year'

// 習慣の繰り返し頻度 (DB値)
export type HabitFrequency = 'daily' | 'weekdays' | 'custom'

// 習慣ログのステータス
export type HabitStatus = 'completed' | 'skipped'

// 目標
export type Goal = {
  id: string
  user_id: string
  title: string
  course_type: CourseType
  start_date: string
  target_date: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

// 習慣
export type Habit = {
  id: string
  goal_id: string
  user_id: string
  title: string
  category: string       // DB英語値 ('learning' など)
  frequency: HabitFrequency
  schedule_days: number[]
  is_active: boolean
  created_at: string
}

// 習慣の完了ログ
export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  completed_at: string   // date 型 (YYYY-MM-DD)
  status: HabitStatus
  points_earned: number
  created_at: string
}

// モンスターの進化ステージ (1〜11)
export type MonsterStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

// モンスターの5つの能力値
export type MonsterStats = {
  int_val: number
  str_val: number
  mnd_val: number
  dex_val: number
  cha_val: number
}

// モンスター
export type Monster = {
  id: string
  goal_id: string
  user_id: string
  name: string
  stage: MonsterStage
  total_points: number
  level: number
  created_at: string
  updated_at: string
}
