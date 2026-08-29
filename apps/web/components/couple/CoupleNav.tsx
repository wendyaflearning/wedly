'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { WEDDREAM_GALLERY_PATH } from '@/lib/couple-space'
import type { CoupleSession } from '@/lib/couple'

interface CoupleNavProps {
  session: CoupleSession
}

function CoupleAvatarMenu({
  firstName,
  lastName,
  email,
}: {
  firstName: string
  lastName?: string | null
  email?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-bordeaux text-xs font-semibold tracking-[0.04em] text-white"
        style={{
          fontFamily: 'var(--font-manrope-var)',
          boxShadow: '0 0 0 2.5px rgba(255,246,237,0.4)',
        }}
        aria-label="Menu compte"
      >
        {initials || firstName[0]?.toUpperCase()}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[268px] overflow-hidden rounded-2xl bg-creme"
          style={{
            border: '0.5px solid rgba(78,26,50,0.12)',
            boxShadow: '0px 8px 28px rgba(41,26,16,0.18), 0px 2px 6px rgba(41,26,16,0.08)',
          }}
        >
          <div className="px-5 pb-4 pt-5">
            <p className="text-[15px] font-semibold leading-snug text-texte" style={{ fontFamily: 'var(--font-manrope-var)' }}>
              {fullName || firstName}
            </p>
            {email && (
              <p className="mt-0.5 text-[12px] text-gris" style={{ fontFamily: 'var(--font-manrope-var)' }}>
                {email}
              </p>
            )}
          </div>

          <hr className="mx-0 h-px border-0 bg-bordeaux/10" />

          <div className="py-1.5">
            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-3 px-5 py-[11px] text-[13px] font-medium text-highlight transition-colors hover:bg-highlight/5"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6.5 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3.5" stroke="#E35704" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M11 11.5l3.5-3.5L11 4.5M14.5 8H6.5" stroke="#E35704" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Top chrome for Mon espace Wedly — aligned with VendorNav band height and
 * palette, without vendor-only destinations.
 */
export function CoupleNav({ session }: CoupleNavProps) {
  const pathname = usePathname()
  const galleryActive = pathname.startsWith(WEDDREAM_GALLERY_PATH)

  return (
    <header className="sticky top-0 z-50 border-b border-bordeaux/10 bg-creme font-manrope">
      <div className="mx-auto flex h-15 max-w-[1280px] items-center justify-between gap-4 px-5 md:h-18 md:px-10">
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

        <CoupleAvatarMenu
          firstName={session.firstName}
          lastName={session.lastName}
          email={session.email}
        />
      </div>
    </header>
  )
}
