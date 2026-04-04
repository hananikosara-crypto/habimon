// ============================================================
// ストリーク計算ロジック
// ============================================================

export type HabitLogForStreak = {
  completed_at: string  // YYYY-MM-DD (date型)
  status?: string       // 'completed' | 'skipped' — skipped はストリークに含めない
}

/**
 * habit_logs から連続実施日数を計算する
 * ルール: 1日に1つ以上「completed」があれば継続とみなす
 */
export function calcStreak(
  logs: HabitLogForStreak[],
  _pauseDates: string[] = []
): number {
  if (logs.length === 0) return 0

  // completed のみカウント（skipped は除外）
  const completedLogs = logs.filter(l => !l.status || l.status === 'completed')
  if (completedLogs.length === 0) return 0

  // 完了した日付（YYYY-MM-DD）の Set を作成
  const dates = new Set(completedLogs.map((log) => log.completed_at.slice(0, 10)))

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
 * 今日の初回完了後の新ストリークを計算する
 */
export function calcNewStreak(currentStreak: number, completedToday: boolean): number {
  if (completedToday) return currentStreak
  return currentStreak + 1
}
