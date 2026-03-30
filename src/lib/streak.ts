// ============================================================
// ストリーク計算ロジック
// ============================================================

export type HabitLogForStreak = {
  completed_at: string  // ISO 8601 文字列
}

/**
 * habit_logs から連続実施日数を計算する
 * ルール: 1日に1つ以上完了していれば継続とみなす
 * - 今日完了がない場合は昨日から遡って計算する
 * - 将来のポーズモード対応のため pause_dates パラメータを予約している
 */
export function calcStreak(
  logs: HabitLogForStreak[],
  _pauseDates: string[] = []  // 将来用（ポーズモード）
): number {
  if (logs.length === 0) return 0

  // 完了した日付（YYYY-MM-DD）の Set を作成
  // UTC ベースで日付を取るが、将来的には JST に変換する余地あり
  const dates = new Set(logs.map((log) => log.completed_at.slice(0, 10)))

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  let streak = 0
  const checking = new Date(today)

  // 今日まだ完了がなければ昨日から数え始める
  if (!dates.has(todayStr)) {
    checking.setDate(checking.getDate() - 1)
  }

  while (true) {
    const dateStr = checking.toISOString().slice(0, 10)
    if (dates.has(dateStr)) {
      streak++
      checking.setDate(checking.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * 新しいストリーク日数（今日の初回完了後）を計算する
 * completedToday: 今日すでに完了済みの習慣があるか
 */
export function calcNewStreak(currentStreak: number, completedToday: boolean): number {
  if (completedToday) {
    // 今日すでに完了があるので streak は変わらない
    return currentStreak
  }
  // 今日が初回完了 → 1日延びる
  return currentStreak + 1
}
