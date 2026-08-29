'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COUPLE_SPACE_TABS } from '@/lib/couple-space'

export function CoupleSpaceTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="-mx-5 border-b border-bordeaux/10 px-5 md:-mx-10 md:px-10"
      aria-label="Zones de Mon espace Wedly"
    >
      <div className="flex gap-0 overflow-x-auto scrollbar-none md:gap-10">
        {COUPLE_SPACE_TABS.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={[
                'shrink-0 border-b-2 px-1 py-3 text-[13px] font-semibold no-underline transition-colors md:py-4 md:text-[14px]',
                isActive
                  ? 'border-accent text-bordeaux'
                  : 'border-transparent text-gris hover:text-texte',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
