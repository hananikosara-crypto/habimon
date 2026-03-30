'use client'

import { useEffect, useState } from 'react'
import { getStageEmoji } from '@/constants/monster'
import type { MonsterStage } from '@/types'

type Phase = 'old' | 'flash' | 'new' | 'done'

type EvolutionAnimationProps = {
  monsterName: string
  oldStage: MonsterStage
  newStage: MonsterStage
  oldStageName: string
  newStageName: string
  onClose: () => void
}

// キラキラの位置
const SPARKLES = [
  { top: '-18%', left: '20%',  cls: 'evo-sparkle-1', size: 'text-2xl' },
  { top: '-10%', right: '15%', cls: 'evo-sparkle-2', size: 'text-3xl' },
  { top: '50%',  left: '-15%', cls: 'evo-sparkle-3', size: 'text-2xl' },
  { top: '55%',  right: '-12%',cls: 'evo-sparkle-4', size: 'text-xl'  },
]

export default function EvolutionAnimation({
  monsterName,
  oldStage,
  newStage,
  oldStageName,
  newStageName,
  onClose,
}: EvolutionAnimationProps) {
  const [phase, setPhase] = useState<Phase>('old')

  useEffect(() => {
    // フェーズのタイムライン
    const t1 = setTimeout(() => setPhase('flash'), 1600)  // 旧絵文字退場
    const t2 = setTimeout(() => setPhase('new'),   2300)  // 新絵文字登場
    const t3 = setTimeout(() => setPhase('done'),  3600)  // メッセージ・ボタン表示
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="evo-overlay fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(6, 24, 18, 0.92)' }}
    >
      {/* ===== フラッシュレイヤー ===== */}
      {phase === 'flash' && (
        <div
          className="evo-flash fixed inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #fff 0%, rgba(255,255,255,0) 70%)' }}
        />
      )}

      {/* ===== 絵文字エリア ===== */}
      <div className="relative flex items-center justify-center w-48 h-48 mb-6 z-20">
        {/* 旧絵文字 */}
        {(phase === 'old' || phase === 'flash') && (
          <span
            className={`text-9xl select-none leading-none ${phase === 'flash' ? 'evo-old-exit' : ''}`}
            style={{ filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.8))' }}
          >
            {getStageEmoji(oldStage)}
          </span>
        )}

        {/* 新絵文字 */}
        {(phase === 'new' || phase === 'done') && (
          <>
            <span
              className="evo-new-enter evo-aura text-9xl select-none leading-none rounded-full"
              style={{ filter: 'drop-shadow(0 0 32px rgba(16,185,129,1))' }}
            >
              {getStageEmoji(newStage)}
            </span>

            {/* キラキラ */}
            {SPARKLES.map((sp) => (
              <span
                key={sp.cls}
                className={`absolute ${sp.cls} ${sp.size} select-none`}
                style={{ top: sp.top, left: sp.left, right: (sp as { right?: string }).right }}
              >
                ✨
              </span>
            ))}
          </>
        )}
      </div>

      {/* ===== メッセージエリア ===== */}
      {phase === 'done' && (
        <div className="evo-message-in text-center z-20 space-y-3 max-w-sm">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            進化！
          </p>
          <h2 className="text-white text-3xl font-bold leading-tight">
            {monsterName}が<br />進化した！
          </h2>
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-gray-300 text-sm bg-gray-700/60 px-3 py-1 rounded-full">
              {oldStageName}
            </span>
            <span className="text-emerald-400 text-lg">→</span>
            <span className="text-white text-sm bg-emerald-700/80 px-3 py-1 rounded-full font-semibold">
              {newStageName}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            素晴らしい継続力です！
          </p>
        </div>
      )}

      {/* ===== 閉じるボタン ===== */}
      {phase === 'done' && (
        <button
          type="button"
          onClick={onClose}
          className="evo-button-in mt-8 z-20 bg-emerald-500 hover:bg-emerald-400 active:scale-95
            text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all
            shadow-lg shadow-emerald-900/50"
        >
          やったー！🎉
        </button>
      )}

      {/* フェーズが old/flash のときも薄くスキップできるヒント */}
      {phase !== 'done' && (
        <button
          type="button"
          onClick={onClose}
          className="absolute bottom-8 right-6 text-gray-500 text-xs hover:text-gray-300 transition-colors z-20"
        >
          スキップ
        </button>
      )}
    </div>
  )
}
