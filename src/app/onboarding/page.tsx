'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { CATEGORY_TO_DB, CATEGORY_LIST } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GoalCategory, CourseType, HabitFrequency } from '@/types'

const TOTAL_STEPS = 3
const FREQUENCIES: HabitFrequency[] = ['毎日', '週次', 'カスタム']
const MAX_HABITS = 5

type HabitInput = {
  title: string
  frequency: HabitFrequency
  category: GoalCategory
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step1: 目標（タイトル + コース期間のみ）
  const [goalTitle, setGoalTitle] = useState('')
  const [courseType, setCourseType] = useState<CourseType | ''>('')

  // Step2: 習慣（カテゴリ付き、最大5個）
  const [habits, setHabits] = useState<HabitInput[]>([
    { title: '', frequency: '毎日', category: '学習' },
  ])

  // Step3: モンスター命名
  const [monsterName, setMonsterName] = useState('')

  const progress = ((step - 1) / TOTAL_STEPS) * 100

  // バリデーション
  const step1Valid = goalTitle.trim() !== '' && courseType !== ''
  const step2Valid = habits.length >= 1 && habits.every(h => h.title.trim() !== '')

  const addHabit = () => {
    if (habits.length < MAX_HABITS) {
      setHabits([...habits, { title: '', frequency: '毎日', category: '学習' }])
    }
  }

  const removeHabit = (index: number) => {
    if (habits.length > 1) {
      setHabits(habits.filter((_, i) => i !== index))
    }
  }

  const updateHabit = <K extends keyof HabitInput>(index: number, field: K, value: HabitInput[K]) => {
    setHabits(habits.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  // データ保存
  const handleFinish = async () => {
    if (!user) {
      setError('ログインが必要です。ページをリロードしてください。')
      return
    }
    if (!goalTitle.trim() || !courseType) {
      setError('目標タイトルとコース期間を入力してください。')
      return
    }

    setSaving(true)
    setError('')

    const validHabits = habits.filter(h => h.title.trim() !== '')

    try {
      // ---- Step 1: 目標を作成（categoryカラムは不要 - DBデフォルト値を使用） ----
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalTitle.trim(),
          course_type: courseType,
        })
        .select()
        .single()

      if (goalError) {
        console.error('[onboarding] goals INSERT failed:', goalError)
        throw new Error(`目標の保存に失敗しました: ${goalError.message}`)
      }
      console.log('[onboarding] goal created:', goal.id)

      // ---- Step 2: モンスターを作成 ----
      const { data: monster, error: monsterError } = await supabase
        .from('monsters')
        .insert({
          goal_id: goal.id,
          user_id: user.id,
          name: monsterName.trim() || 'ハビモン',
          stage: 1,
          total_points: 0,
          level: 1,
        })
        .select()
        .single()

      if (monsterError) {
        console.error('[onboarding] monsters INSERT failed:', monsterError)
        throw new Error(`モンスターの保存に失敗しました: ${monsterError.message}`)
      }
      console.log('[onboarding] monster created:', monster.id)

      // ---- Step 3: モンスター能力値を初期化 ----
      const { error: statsError } = await supabase
        .from('monster_stats')
        .insert({
          monster_id: monster.id,
          int_val: 0,
          str_val: 0,
          mnd_val: 0,
          dex_val: 0,
          cha_val: 0,
        })

      if (statsError) {
        console.error('[onboarding] monster_stats INSERT failed:', statsError)
        throw new Error(`モンスター能力値の保存に失敗しました: ${statsError.message}`)
      }
      console.log('[onboarding] monster_stats created')

      // ---- Step 4: 習慣を作成（categoryを英語値でDB保存） ----
      if (validHabits.length > 0) {
        const { error: habitsError } = await supabase
          .from('habits')
          .insert(
            validHabits.map(h => ({
              goal_id: goal.id,
              user_id: user.id,
              title: h.title.trim(),
              frequency: h.frequency,
              category: CATEGORY_TO_DB[h.category],  // 日本語 → 英語に変換してDB保存
            }))
          )

        if (habitsError) {
          console.error('[onboarding] habits INSERT failed:', habitsError)
          throw new Error(`習慣の保存に失敗しました: ${habitsError.message}`)
        }
        console.log('[onboarding] habits created:', validHabits.length)
      }

      router.replace('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'データの保存に失敗しました'
      console.error('[onboarding] handleFinish error:', err)
      setError(message)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 items-start justify-center p-4 bg-gradient-to-b from-emerald-50 to-white min-h-screen pt-12">
      <div className="w-full max-w-lg">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🥚</div>
          <h1 className="text-2xl font-bold text-emerald-700">HabiMon</h1>
          <p className="text-muted-foreground text-sm mt-1">冒険の準備をしましょう！</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>ステップ {step} / {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {['目標設定', '習慣登録', 'モンスター命名'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ======== Step 1: 目標設定（タイトル + コース期間のみ） ======== */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> 目標を設定しよう
              </CardTitle>
              <CardDescription>達成したい目標を1つ入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="goal-title">目標タイトル</Label>
                <Input
                  id="goal-title"
                  placeholder="例: 毎日英語を勉強する"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>コース期間</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['1年', '3年'] as CourseType[]).map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => setCourseType(course)}
                      className={`p-4 rounded-lg border-2 text-center transition-all
                        ${courseType === course
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-border hover:border-emerald-300'
                        }`}
                    >
                      <div className="text-2xl mb-1">{course === '1年' ? '🌱' : '🌳'}</div>
                      <div className="font-semibold">{course}コース</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {course === '1年' ? '7段階進化' : '11段階進化'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                次へ →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ======== Step 2: 習慣登録（カテゴリ付き、最大5個） ======== */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span> 習慣を登録しよう
              </CardTitle>
              <CardDescription>各習慣にカテゴリと頻度を設定してください（1〜{MAX_HABITS}個）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {habits.map((habit, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">習慣 {index + 1}</span>
                    {habits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHabit(index)}
                        className="text-xs text-destructive hover:underline"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  {/* タイトル */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`habit-title-${index}`}>習慣のタイトル</Label>
                    <Input
                      id={`habit-title-${index}`}
                      placeholder="例: 英単語を10個覚える"
                      value={habit.title}
                      onChange={(e) => updateHabit(index, 'title', e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* カテゴリ */}
                  <div className="space-y-1.5">
                    <Label>カテゴリ</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_LIST.map((cat) => (
                        <Badge
                          key={cat}
                          variant={habit.category === cat ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors text-xs
                            ${habit.category === cat ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-emerald-50'}`}
                          onClick={() => updateHabit(index, 'category', cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 頻度 */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`habit-freq-${index}`}>頻度</Label>
                    <Select
                      value={habit.frequency}
                      onValueChange={(val) => updateHabit(index, 'frequency', val as HabitFrequency)}
                    >
                      <SelectTrigger id={`habit-freq-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((freq) => (
                          <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              {habits.length < MAX_HABITS && (
                <button
                  type="button"
                  onClick={addHabit}
                  className="w-full py-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-sm text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  + 習慣を追加（{habits.length}/{MAX_HABITS}）
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  ← 戻る
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                >
                  次へ →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ======== Step 3: モンスター命名 + 確認サマリー ======== */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🥚</span> モンスターに名前をつけよう
              </CardTitle>
              <CardDescription>あなたと一緒に成長するモンスターです</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center py-6 bg-gradient-to-b from-emerald-50 to-white rounded-xl border">
                <div className="text-8xl mb-3 animate-bounce">🥚</div>
                <Badge variant="secondary" className="text-xs">ステージ 1 / たまご</Badge>
                <p className="text-sm text-muted-foreground mt-2 text-center px-4">
                  習慣を続けるとモンスターが進化します！<br />
                  {courseType === '1年' ? '7段階' : '11段階'}の進化が待っています
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monster-name">モンスターの名前</Label>
                <Input
                  id="monster-name"
                  placeholder="ハビモン"
                  value={monsterName}
                  onChange={(e) => setMonsterName(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  空白のままにすると「ハビモン」になります
                </p>
              </div>

              {/* 確認サマリー */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-muted-foreground mb-3">確認サマリー</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">目標</span>
                  <span className="font-medium truncate max-w-[200px]">{goalTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">コース</span>
                  <span>{courseType}コース（{courseType === '1年' ? '7段階' : '11段階'}進化）</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">習慣数</span>
                  <span>{habits.filter(h => h.title.trim()).length}個</span>
                </div>
                <div className="pt-1 space-y-1">
                  {habits.filter(h => h.title.trim()).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[150px]">• {h.title}</span>
                      <Badge variant="secondary" className="text-xs ml-2 shrink-0">{h.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={saving}>
                  ← 戻る
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '🚀 冒険を始める！'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
