'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { CATEGORY_LIST, CATEGORY_TO_DB, dbToCategory, FREQUENCY_LIST, FREQUENCY_LABEL } from '@/lib/categories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import BottomNav from '@/components/BottomNav'
import type { GoalCategory, HabitFrequency } from '@/types'

const MAX_HABITS = 5

type GoalRow = {
  id: string
  title: string
  course_type: string
  status: string
}

type HabitRow = {
  id: string
  goal_id: string
  title: string
  category: string | null
  frequency: HabitFrequency
}

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [goals, setGoals] = useState<GoalRow[]>([])
  const [habits, setHabits] = useState<HabitRow[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // 目標編集状態
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalTitle, setEditingGoalTitle] = useState('')
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  // 習慣追加フォーム
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState<GoalCategory>('学習')
  const [newHabitFreq, setNewHabitFreq] = useState<HabitFrequency>('daily')

  // 習慣編集状態
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingHabitTitle, setEditingHabitTitle] = useState('')
  const [editingHabitCategory, setEditingHabitCategory] = useState<GoalCategory>('学習')
  const [editingHabitFreq, setEditingHabitFreq] = useState<HabitFrequency>('daily')

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  const fetchData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, title, course_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const activeGoals = goalsData ?? []
      setGoals(activeGoals)

      if (activeGoals.length > 0) {
        const goalIds = activeGoals.map(g => g.id)
        const { data: habitsData } = await supabase
          .from('habits')
          .select('id, goal_id, title, category, frequency')
          .in('goal_id', goalIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        setHabits(habitsData ?? [])
      } else {
        setHabits([])
      }
    } finally {
      setDataLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!loading && user) fetchData()
  }, [user, loading, fetchData])

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ---- 目標タイトル保存 ----
  const saveGoalTitle = async (goalId: string) => {
    if (!editingGoalTitle.trim()) return
    setBusy(true)
    const { error } = await supabase
      .from('goals')
      .update({ title: editingGoalTitle.trim() })
      .eq('id', goalId)
      .eq('user_id', user!.id)
    setBusy(false)
    if (error) {
      showMsg('保存に失敗しました', 'error')
    } else {
      showMsg('目標を更新しました', 'success')
      setEditingGoalId(null)
      fetchData()
    }
  }

  // ---- 目標削除 ----
  const deleteGoal = async (goalId: string) => {
    if (!confirm('目標を削除すると、関連する習慣・モンスターもすべて削除されます。本当によいですか？')) {
      setDeletingGoalId(null)
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user!.id)
    setBusy(false)
    setDeletingGoalId(null)
    if (error) {
      showMsg('削除に失敗しました', 'error')
    } else {
      showMsg('目標を削除しました', 'success')
      fetchData()
    }
  }

  // ---- 習慣追加 ----
  const addHabit = async () => {
    if (!newHabitTitle.trim() || habits.length >= MAX_HABITS) return
    const primaryGoal = goals[0]
    if (!primaryGoal) return
    setBusy(true)
    const { error } = await supabase
      .from('habits')
      .insert({
        goal_id: primaryGoal.id,
        user_id: user!.id,
        title: newHabitTitle.trim(),
        category: CATEGORY_TO_DB[newHabitCategory],
        frequency: newHabitFreq,
      })
    setBusy(false)
    if (error) {
      showMsg('習慣の追加に失敗しました', 'error')
    } else {
      showMsg('習慣を追加しました', 'success')
      setNewHabitTitle('')
      setNewHabitCategory('学習')
      setNewHabitFreq('daily')
      setShowAddHabit(false)
      fetchData()
    }
  }

  // ---- 習慣編集保存 ----
  const saveHabit = async (habitId: string) => {
    if (!editingHabitTitle.trim()) return
    setBusy(true)
    const { error } = await supabase
      .from('habits')
      .update({
        title: editingHabitTitle.trim(),
        category: CATEGORY_TO_DB[editingHabitCategory],
        frequency: editingHabitFreq,
      })
      .eq('id', habitId)
      .eq('user_id', user!.id)
    setBusy(false)
    if (error) {
      showMsg('保存に失敗しました', 'error')
    } else {
      showMsg('習慣を更新しました', 'success')
      setEditingHabitId(null)
      fetchData()
    }
  }

  // ---- 習慣削除 ----
  const deleteHabit = async (habitId: string) => {
    if (!confirm('この習慣を削除しますか？')) return
    setBusy(true)
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user!.id)
    setBusy(false)
    if (error) {
      showMsg('削除に失敗しました', 'error')
    } else {
      showMsg('習慣を削除しました', 'success')
      fetchData()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/auth')
  }

  if (loading || dataLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <span className="font-bold text-emerald-700">⚙️ 設定</span>
        </div>
      </header>

      {/* トーストメッセージ */}
      {message && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all
          ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ---- プロフィール ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">👤 プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">メールアドレス</span>
              <span className="font-medium truncate max-w-[200px]">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ユーザーID</span>
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                {user?.id}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ---- 目標管理 ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 目標管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                目標がありません。
                <button className="text-emerald-600 underline ml-1" onClick={() => router.push('/onboarding')}>
                  オンボーディングへ
                </button>
              </p>
            ) : (
              goals.map(goal => (
                <div key={goal.id} className="border border-border rounded-xl p-3 space-y-2">
                  {editingGoalId === goal.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingGoalTitle}
                        onChange={e => setEditingGoalTitle(e.target.value)}
                        maxLength={50}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => saveGoalTitle(goal.id)} disabled={busy}>
                          保存
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => setEditingGoalId(null)} disabled={busy}>
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.course_type === '1year' ? '1年コース（7段階）' : '3年コース（11段階）'}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => { setEditingGoalId(goal.id); setEditingGoalTitle(goal.title) }}
                          className="text-xs text-blue-600 hover:underline px-1"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-xs text-destructive hover:underline px-1"
                          disabled={busy}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ---- 習慣管理 ---- */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">📝 習慣管理</CardTitle>
              <span className="text-xs text-muted-foreground">{habits.length} / {MAX_HABITS}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 && !showAddHabit && (
              <p className="text-sm text-muted-foreground text-center py-2">習慣が登録されていません</p>
            )}

            {/* 習慣一覧 */}
            {habits.map(habit => {
              const cat = dbToCategory(habit.category)
              return (
                <div key={habit.id} className="border border-border rounded-xl p-3 space-y-2">
                  {editingHabitId === habit.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingHabitTitle}
                        onChange={e => setEditingHabitTitle(e.target.value)}
                        maxLength={50}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1">
                        {CATEGORY_LIST.map(c => (
                          <Badge
                            key={c}
                            variant={editingHabitCategory === c ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs
                              ${editingHabitCategory === c ? 'bg-emerald-600' : 'hover:bg-emerald-50'}`}
                            onClick={() => setEditingHabitCategory(c)}
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {FREQUENCY_LIST.map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setEditingHabitFreq(f)}
                            className={`text-xs px-2 py-1 rounded-lg border transition-colors
                              ${editingHabitFreq === f ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border hover:border-emerald-300'}`}
                          >
                            {FREQUENCY_LABEL[f]}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => saveHabit(habit.id)} disabled={busy}>
                          保存
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => setEditingHabitId(null)} disabled={busy}>
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{habit.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-xs">{cat}</Badge>
                          <span className="text-xs text-muted-foreground">{FREQUENCY_LABEL[habit.frequency as keyof typeof FREQUENCY_LABEL] ?? habit.frequency}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHabitId(habit.id)
                            setEditingHabitTitle(habit.title)
                            setEditingHabitCategory(dbToCategory(habit.category))
                            setEditingHabitFreq(habit.frequency)
                          }}
                          className="text-xs text-blue-600 hover:underline px-1"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHabit(habit.id)}
                          className="text-xs text-destructive hover:underline px-1"
                          disabled={busy}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 習慣追加フォーム */}
            {showAddHabit && (
              <div className="border border-emerald-300 rounded-xl p-3 space-y-2 bg-emerald-50/50">
                <p className="text-xs font-semibold text-emerald-700">新しい習慣を追加</p>
                <Input
                  placeholder="習慣のタイトル"
                  value={newHabitTitle}
                  onChange={e => setNewHabitTitle(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <div className="flex flex-wrap gap-1">
                  {CATEGORY_LIST.map(c => (
                    <Badge
                      key={c}
                      variant={newHabitCategory === c ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs
                        ${newHabitCategory === c ? 'bg-emerald-600' : 'hover:bg-emerald-50'}`}
                      onClick={() => setNewHabitCategory(c)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1">
                  {FREQUENCY_LIST.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setNewHabitFreq(f)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors
                        ${newHabitFreq === f ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border hover:border-emerald-300'}`}
                    >
                      {FREQUENCY_LABEL[f]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={addHabit} disabled={busy || !newHabitTitle.trim()}>
                    追加
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setShowAddHabit(false); setNewHabitTitle('') }} disabled={busy}>
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {/* 習慣追加ボタン */}
            {!showAddHabit && habits.length < MAX_HABITS && goals.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddHabit(true)}
                className="w-full py-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-sm text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                + 習慣を追加（{habits.length}/{MAX_HABITS}）
              </button>
            )}
          </CardContent>
        </Card>

        {/* ---- アカウント ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">⚙️ アカウント</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              ログアウト
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2">HabiMon β1.0</p>
      </main>

      <BottomNav />
    </div>
  )
}
