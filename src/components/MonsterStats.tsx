'use client'

import { Progress } from '@/components/ui/progress'

type StatsData = {
  int_val: number  // 知力
  str_val: number  // 体力
  mnd_val: number  // 精神力
  dex_val: number  // 器用さ
  cha_val: number  // 魅力
}

type StatConfig = {
  key: keyof StatsData
  label: string
  icon: string
  color: string
  barColor: string
}

const STAT_CONFIG: StatConfig[] = [
  { key: 'int_val', label: '知力',  icon: '📚', color: 'text-blue-600',   barColor: 'bg-blue-500'   },
  { key: 'str_val', label: '体力',  icon: '💪', color: 'text-green-600',  barColor: 'bg-green-500'  },
  { key: 'mnd_val', label: '精神力',icon: '🧘', color: 'text-purple-600', barColor: 'bg-purple-500' },
  { key: 'dex_val', label: '器用さ',icon: '🛠️', color: 'text-orange-600', barColor: 'bg-orange-500' },
  { key: 'cha_val', label: '魅力',  icon: '✨', color: 'text-pink-600',   barColor: 'bg-pink-500'   },
]

// 最大値（100 を上限として視覚的に表示）
const MAX_DISPLAY = 100

type MonsterStatsProps = {
  stats: StatsData
}

export default function MonsterStats({ stats }: MonsterStatsProps) {
  // 実際の最大値（バーの比率計算用 — 最低でも 10 を保証）
  const actualMax = Math.max(MAX_DISPLAY, ...Object.values(stats))

  return (
    <div className="space-y-4">
      {STAT_CONFIG.map((cfg) => {
        const val = stats[cfg.key]
        const pct = Math.min(100, Math.round((val / actualMax) * 100))
        // 星表示: 5段階（0〜20=0星, 21〜40=1星, ...）
        const stars = Math.min(5, Math.ceil(val / 20))

        return (
          <div key={cfg.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{cfg.icon}</span>
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 星表示 */}
                <span className="text-yellow-400 text-xs">
                  {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                </span>
                <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                  {val}
                </span>
              </div>
            </div>
            {/* カラープログレスバー（shadcn Progress を上書き） */}
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
