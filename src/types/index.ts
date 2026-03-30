// ============================================================
// HabiMon 基本型定義
// ============================================================

// ユーザー
export type User = {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// 目標カテゴリ
export type GoalCategory = '学習' | '健康' | '仕事' | '生活' | '趣味' | 'その他'

// 目標のコースタイプ（進化段階数が変わる）
export type CourseType = '1年' | '3年'

// 目標
export type Goal = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: GoalCategory
  course_type: CourseType
  is_active: boolean
  created_at: string
  updated_at: string
}

// 習慣の繰り返し頻度
export type HabitFrequency = '毎日' | '週次' | 'カスタム'

// 習慣
export type Habit = {
  id: string
  goal_id: string
  user_id: string
  title: string
  description: string | null
  frequency: HabitFrequency
  // カスタム頻度の場合: 0=日, 1=月, ..., 6=土
  frequency_days: number[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// 習慣の完了ログ
export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  completed_at: string  // ISO 8601 日付文字列
  points_earned: number
  note: string | null
}

// モンスターの進化ステージ（1=たまご 〜 11=最終形態）
export type MonsterStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

// モンスターの5つの能力値
export type MonsterStats = {
  int: number   // 知性（Intelligence）
  str: number   // 力（Strength）
  mnd: number   // 精神（Mind）
  dex: number   // 器用（Dexterity）
  cha: number   // 魅力（Charisma）
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
  stats: MonsterStats
  created_at: string
  updated_at: string
}

// ============================================================
// UI / 画面表示用の複合型
// ============================================================

// 目標とモンスターをまとめて扱う型
export type GoalWithMonster = Goal & {
  monster: Monster
}

// 習慣と直近のログをまとめて扱う型
export type HabitWithLog = Habit & {
  last_log: HabitLog | null
  current_streak: number
}
