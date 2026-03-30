// ============================================================
// モンスター表示用共有定数
// ============================================================

import type { MonsterStage } from '@/types'

/** ステージ番号 → 絵文字 */
export const STAGE_EMOJI: Record<number, string> = {
  1:  '🥚',
  2:  '🐣',
  3:  '🐥',
  4:  '🐤',
  5:  '🦆',
  6:  '🦅',
  7:  '🐉',
  8:  '🔥',
  9:  '⚡',
  10: '🌟',
  11: '✨',
}

export function getStageEmoji(stage: MonsterStage | number): string {
  return STAGE_EMOJI[stage] ?? '🥚'
}
