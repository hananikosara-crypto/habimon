'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'ホーム' },
  { href: '/calendar', icon: '📅', label: 'カレンダー' },
  { href: '/monster', icon: '🐉', label: 'モンスター' },
  { href: '/settings', icon: '⚙️', label: '設定' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-area-pb z-50">
      <ul className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href} className="flex-1 relative">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 w-full transition-colors
                  ${isActive ? 'text-emerald-600' : 'text-muted-foreground hover:text-emerald-500'}`}
              >
                <span className="text-2xl leading-none">{item.icon}</span>
                <span className={`text-xs font-medium ${isActive ? 'text-emerald-600' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
