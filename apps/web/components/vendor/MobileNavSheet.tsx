'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface MobileNavSheetProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  {
    label: 'Accueil',
    href: '/dashboard',
    locked: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2.5 7.5L9 2L15.5 7.5V16a.5.5 0 01-.5.5H11.5V12a.5.5 0 00-.5-.5H7a.5.5 0 00-.5.5v4.5H3a.5.5 0 01-.5-.5V7.5z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Wedmatch',
    href: null,
    locked: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="6.5" cy="9" r="4" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="11.5" cy="9" r="4" stroke="currentColor" strokeWidth="1.35" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: null,
    locked: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="3" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.35" />
        <path d="M5.5 15.5L7.5 12.5H10.5L12.5 15.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Mon profil',
    href: '/profil',
    locked: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.35" />
        <path d="M2.5 16.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    locked: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.35" />
        <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M4.1 13.9l1.1-1.1M12.8 5.2l1.1-1.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    ),
  },
]

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

export function MobileNavSheet({ isOpen, onClose }: MobileNavSheetProps) {
  const pathname = usePathname()

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Navigation">
      {/* Items */}
      <div className="px-5 pt-1 pb-2">
        {NAV_ITEMS.map((item, i) => {
          const isActive = item.href !== null && pathname === item.href
          const isNavigable = item.href !== null && !item.locked

          const iconColor = isActive
            ? 'text-accent'
            : item.locked
            ? 'text-bordeaux/30'
            : 'text-bordeaux/50'

          const iconBg = isActive
            ? 'bg-accent/10'
            : 'bg-bordeaux/[0.06]'

          const labelColor = isActive
            ? 'text-texte'
            : item.locked
            ? 'text-bordeaux/30'
            : 'text-bordeaux/55'

          const row = (
            <div className="flex items-center justify-between py-[15px]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[16px] font-medium ${labelColor}`}
                  style={{ fontFamily: 'var(--font-manrope-var)' }}
                >
                  {item.label}
                </span>
              </div>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-highlight shrink-0" />
              )}
            </div>
          )

          return (
            <div key={item.label}>
              {isNavigable ? (
                <Link href={item.href!} onClick={onClose} className="block no-underline">
                  {row}
                </Link>
              ) : (
                <div className="cursor-default">{row}</div>
              )}
              {i < NAV_ITEMS.length - 1 && (
                <div className="h-px bg-bordeaux/[0.07]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Logout */}
      <div className="px-5 pb-8 pt-1 border-t border-bordeaux/[0.07]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-4 text-[14px] font-medium text-highlight cursor-pointer"
          style={{ fontFamily: 'var(--font-manrope-var)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7.5 16H4a1 1 0 01-1-1V3a1 1 0 011-1h3.5" stroke="#E35704" strokeWidth="1.35" strokeLinecap="round" />
            <path d="M12.5 13l3.5-4-3.5-4M16 9H7.5" stroke="#E35704" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </BottomSheet>
  )
}
