'use client'

type StatusCardsProps = {
  streak: number
  totalPoints: number
  level: number
  completionRate: number  // 0〜100
}

type CardData = {
  icon: string
  label: string
  value: string
  sub?: string
  color: string
}

export default function StatusCards({
  streak,
  totalPoints,
  level,
  completionRate,
}: StatusCardsProps) {
  const cards: CardData[] = [
    {
      icon: '🔥',
      label: 'ストリーク',
      value: `${streak}`,
      sub: '日連続',
      color: 'from-orange-50 to-red-50 border-orange-100',
    },
    {
      icon: '⭐',
      label: '合計ポイント',
      value: totalPoints.toLocaleString(),
      sub: 'pt',
      color: 'from-yellow-50 to-amber-50 border-yellow-100',
    },
    {
      icon: '🏅',
      label: 'レベル',
      value: `${level}`,
      sub: 'Lv',
      color: 'from-emerald-50 to-green-50 border-emerald-100',
    },
    {
      icon: '📊',
      label: '今日の完了率',
      value: `${completionRate}`,
      sub: '%',
      color: 'from-blue-50 to-sky-50 border-blue-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.color} border rounded-xl p-3 text-center`}
        >
          <div className="text-2xl mb-1">{card.icon}</div>
          <div className="text-xl font-bold text-gray-800 leading-none">
            {card.value}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">{card.sub}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
