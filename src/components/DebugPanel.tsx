'use client'

// ============================================================
// デバッグパネル — localhost 専用
// window.location.hostname === 'localhost' の場合のみ表示
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { calcStage } from '@/constants/evolution'
import { calcLevel } from '@/lib/points'
import type { MonsterStage, CourseType } from '@/types'

type DebugPanelProps = {
  monsterId: string
  monsterName: string
  userId: string
  habitIds: string[]
  currentStage: MonsterStage
  currentPoints: number
  courseType: CourseType
  onRefresh: () => Promise<void>
  onTriggerEvolution: (oldStage: MonsterStage, newStage: MonsterStage) => void
}

export default function DebugPanel(props: DebugPanelProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // localhost または development 環境のみ表示
    setShow(
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        process.env.NODE_ENV === 'development')
    )
  }, [])

  if (!show) return null
  return <DebugPanelInner {...props} />
}

// ---- 実体（開発時のみ評価される） ----
function DebugPanelInner({
  monsterId,
  monsterName,
  userId,
  habitIds,
  currentStage,
  currentPoints,
  courseType,
  onRefresh,
  onTriggerEvolution,
}: DebugPanelProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stageSelect, setStageSelect] = useState<number>(currentStage)
  const [streakDays, setStreakDays] = useState<string>('7')
  const [message, setMessage] = useState<string>('')

  const run = async (label: string, fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setMessage(`実行中: ${label}...`)
    try {
      await fn()
      setMessage(`✅ ${label} 完了`)
    } catch (e) {
      console.error(e)
      setMessage(`❌ ${label} 失敗`)
    } finally {
      setBusy(false)
    }
  }

  // ---- ポイント加算 ----
  const addPoints = (pts: number) =>
    run(`+${pts}pt`, async () => {
      const newTotal = currentPoints + pts
      const newStage = calcStage(newTotal, courseType)
      const newLevel = calcLevel(newTotal)
      await supabase
        .from('monsters')
        .update({ total_points: newTotal, stage: newStage, level: newLevel })
        .eq('id', monsterId)
      await onRefresh()
    })

  // ---- ポイントリセット ----
  const resetPoints = () =>
    run('ポイントリセット', async () => {
      await supabase
        .from('monsters')
        .update({ total_points: 0, stage: 1, level: 1 })
        .eq('id', monsterId)
      await onRefresh()
    })

  // ---- ステージ直接変更 ----
  const changeStage = () =>
    run(`ステージ→${stageSelect}`, async () => {
      await supabase
        .from('monsters')
        .update({ stage: stageSelect })
        .eq('id', monsterId)
      await onRefresh()
    })

  // ---- 全習慣を今日完了 ----
  const completeAllToday = () =>
    run('全習慣を今日完了', async () => {
      if (habitIds.length === 0) return
      const todayStr = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD (date型)
      const rows = habitIds.map((habitId) => ({
        habit_id: habitId,
        user_id: userId,
        completed_at: todayStr,
        status: 'completed',
        points_earned: 10,
      }))
      // UNIQUE(habit_id, completed_at) があるので onConflict で無視
      await supabase.from('habit_logs').upsert(rows, { onConflict: 'habit_id,completed_at', ignoreDuplicates: true })
      // モンスターのポイントも加算
      const addedPts = habitIds.length * 10
      const newTotal = currentPoints + addedPts
      const newStage = calcStage(newTotal, courseType)
      const newLevel = calcLevel(newTotal)
      await supabase
        .from('monsters')
        .update({ total_points: newTotal, stage: newStage, level: newLevel })
        .eq('id', monsterId)
      await onRefresh()
    })

  // ---- ストリーク設定（指定日数分のログを挿入） ----
  const setStreak = () => {
    const days = parseInt(streakDays, 10)
    if (isNaN(days) || days < 1) { setMessage('⚠️ 正の整数を入力してください'); return }
    const targetHabitId = habitIds[0]
    if (!targetHabitId) { setMessage('⚠️ 習慣が登録されていません'); return }
    run(`ストリーク${days}日設定`, async () => {
      const rows = Array.from({ length: days }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        return {
          habit_id: targetHabitId,
          user_id: userId,
          completed_at: d.toISOString().slice(0, 10),  // YYYY-MM-DD (date型)
          status: 'completed',
          points_earned: 10,
        }
      })
      // UNIQUE(habit_id, completed_at) があるので重複は無視
      await supabase.from('habit_logs').upsert(rows, { onConflict: 'habit_id,completed_at', ignoreDuplicates: true })
      await onRefresh()
    })
  }

  // ---- 進化演出テスト ----
  const testEvolution = () => {
    const nextStage = Math.min(11, currentStage + 1) as MonsterStage
    onTriggerEvolution(currentStage, nextStage)
    setMessage('✅ 進化演出を発動しました')
  }

  // ---- データ全削除（リセット） ----
  const resetAll = () => {
    if (!confirm('⚠️ 全データ（目標・習慣・モンスター）を削除してオンボーディングに戻ります。本当によいですか？')) return
    run('データ全削除', async () => {
      // goals を削除 → CASCADE で habits / habit_logs / monsters が連鎖削除される
      await supabase.from('goals').delete().eq('user_id', userId)
      router.replace('/onboarding')
    })
  }

  // ---- UI ----
  return (
    <div
      className="flex flex-col items-end gap-2"
      style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 9999 }}
    >
      {/* メッセージトースト */}
      {message && (
        <div className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg max-w-[220px] text-right shadow-lg">
          {message}
        </div>
      )}

      {/* 展開パネル */}
      {open && (
        <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl w-64 border border-gray-700 text-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-yellow-400">🔧 デバッグパネル</span>
            <span className="text-gray-400 text-[10px]">開発環境のみ</span>
          </div>

          {/* ポイント加算 */}
          <section className="space-y-1.5">
            <p className="text-gray-400 font-semibold">ポイント加算</p>
            <div className="grid grid-cols-4 gap-1">
              {[100, 500, 1000, 5000].map((pts) => (
                <button
                  key={pts}
                  onClick={() => addPoints(pts)}
                  disabled={busy}
                  className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40
                    rounded-lg py-1.5 font-bold transition-colors text-[10px]"
                >
                  +{pts >= 1000 ? `${pts / 1000}k` : pts}
                </button>
              ))}
            </div>
          </section>

          {/* ポイントリセット */}
          <section>
            <button
              onClick={resetPoints}
              disabled={busy}
              className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-40
                rounded-lg py-1.5 font-bold transition-colors"
            >
              🗑️ ポイントリセット（0に戻す）
            </button>
          </section>

          {/* ステージ変更 */}
          <section className="space-y-1.5">
            <p className="text-gray-400 font-semibold">ステージ直接変更</p>
            <div className="flex gap-1.5">
              <select
                value={stageSelect}
                onChange={(e) => setStageSelect(Number(e.target.value))}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Stage {s}</option>
                ))}
              </select>
              <button
                onClick={changeStage}
                disabled={busy}
                className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40
                  rounded-lg px-3 font-bold transition-colors"
              >
                変更
              </button>
            </div>
          </section>

          {/* 全習慣を今日完了 */}
          <section>
            <button
              onClick={completeAllToday}
              disabled={busy}
              className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40
                rounded-lg py-1.5 font-bold transition-colors"
            >
              ✅ 全習慣を今日完了にする
            </button>
          </section>

          {/* ストリーク設定 */}
          <section className="space-y-1.5">
            <p className="text-gray-400 font-semibold">ストリーク疑似設定</p>
            <div className="flex gap-1.5">
              <input
                type="number"
                min={1}
                max={365}
                value={streakDays}
                onChange={(e) => setStreakDays(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white w-0"
                placeholder="日数"
              />
              <span className="flex items-center text-gray-400">日</span>
              <button
                onClick={setStreak}
                disabled={busy}
                className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40
                  rounded-lg px-3 font-bold transition-colors"
              >
                設定
              </button>
            </div>
          </section>

          {/* 進化演出テスト */}
          <section>
            <button
              onClick={testEvolution}
              disabled={busy || currentStage >= 11}
              className="w-full bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40
                rounded-lg py-1.5 font-bold transition-colors"
            >
              🌟 進化演出テスト（{currentStage}→{Math.min(11, currentStage + 1)}）
            </button>
          </section>

          {/* データ全削除 */}
          <section className="border-t border-gray-700 pt-3">
            <button
              onClick={resetAll}
              disabled={busy}
              className="w-full bg-red-950 hover:bg-red-900 border border-red-700 disabled:opacity-40
                rounded-lg py-1.5 font-bold transition-colors text-red-300"
            >
              ⚠️ データ全削除（リセット）
            </button>
          </section>
        </div>
      )}

      {/* トグルボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 rounded-full shadow-lg text-lg flex items-center justify-center
          transition-all active:scale-90
          ${open ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-yellow-400 border border-gray-600'}`}
        title="デバッグパネル"
      >
        🔧
      </button>
    </div>
  )
}
