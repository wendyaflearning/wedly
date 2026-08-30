'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AvatarMenu } from '@/components/vendor/AvatarMenu'
import { WEDDREAM_GALLERY_PATH } from '@/lib/couple-space'
import type { CoupleSession } from '@/lib/couple'

interface CoupleNavProps {
  session: CoupleSession
}

/**
 * Top chrome for Mon espace Wedly — matches VendorNav band height (64px mobile
 * via h-16, 72px desktop via md:h-18) and palette, without vendor-only destinations.
 */
export function CoupleNav({ session }: CoupleNavProps) {
  const pathname = usePathname()
  const galleryActive = pathname.startsWith(WEDDREAM_GALLERY_PATH)

  return (
    <header className="sticky top-0 z-50 border-b border-bordeaux/10 bg-creme font-manrope">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 md:h-18 md:px-10">
        <Link href="/mon-espace" className="shrink-0">
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_dark_bbyd6m.svg"
            alt="Wedly"
            width={0}
            height={0}
            sizes="300px"
            className="h-5 w-auto md:h-6"
            priority
          />
        </Link>

        <Link
          href={WEDDREAM_GALLERY_PATH}
          className={[
            'inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] no-underline transition-colors md:text-[13px]',
            galleryActive ? 'text-accent' : 'text-texte/55 hover:text-texte',
          ].join(' ')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 12H5M5 12L11 6M5 12L11 18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">Galerie WedDream</span>
          <span className="sm:hidden">WedDream</span>
        </Link>

        <AvatarMenu
          firstName={session.firstName}
          lastName={session.lastName}
          email={session.email}
          showAccountLinks={false}
        />
      </div>
    </header>
  )
}
