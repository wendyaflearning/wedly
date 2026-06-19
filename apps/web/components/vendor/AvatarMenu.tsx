'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface AvatarMenuProps {
  firstName: string
  lastName: string
  email?: string
  status?: string
  direction?: 'down' | 'up'
  variant?: 'light' | 'dark'
}

export function AvatarMenu({
  firstName,
  lastName,
  email,
  status,
  direction = 'down',
  variant = 'light',
}: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
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

  const dropdownPosition =
    direction === 'up'
      ? 'bottom-[calc(100%+12px)]'
      : 'top-[calc(100%+12px)]'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold tracking-[0.04em] cursor-pointer ${variant === 'dark' ? 'bg-white text-bordeaux' : 'bg-bordeaux text-white'}`}
        style={{
          fontFamily: 'var(--font-manrope-var)',
          boxShadow: '0 0 0 2.5px rgba(255,246,237,0.4)',
        }}
        aria-label="Menu compte"
      >
        {initials}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 ${dropdownPosition} w-[268px] bg-creme rounded-2xl overflow-hidden z-50`}
          style={{
            borderWidth: '0.5px',
            border: '0.5px solid rgba(78,26,50,0.12)',
            boxShadow: '0px 8px 28px rgba(41,26,16,0.18), 0px 2px 6px rgba(41,26,16,0.08)',
          }}
        >
          {/* Header — nom, email, badge statut */}
          <div className="px-5 pt-5 pb-4">
            <p
              className="text-[15px] font-semibold text-texte leading-snug"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              {fullName || firstName}
            </p>
            {email && (
              <p
                className="text-[12px] text-gris mt-0.5"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {email}
              </p>
            )}
            {status && (
              <span
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.06em] uppercase"
                style={{
                  fontFamily: 'var(--font-manrope-var)',
                  background: 'rgba(227,87,4,0.08)',
                  color: '#E35704',
                }}
              >
                <span className="w-[6px] h-[6px] rounded-full bg-highlight flex-shrink-0" />
                {status}
              </span>
            )}
          </div>

          <hr className="border-0 h-px bg-bordeaux/10 mx-0" />

          {/* Liens navigation */}
          <div className="py-1.5">
            <Link
              href="/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-5 py-[11px] text-[13px] font-medium text-texte no-underline hover:bg-bordeaux/5 transition-colors"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.75" stroke="#291A10" strokeWidth="1.3" />
                <path d="M2 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#291A10" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Mon profil
            </Link>

            <Link
              href="/parametres"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-5 py-[11px] text-[13px] font-medium text-texte no-underline hover:bg-bordeaux/5 transition-colors"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.25" stroke="#291A10" strokeWidth="1.3" />
                <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5" stroke="#291A10" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="#291A10" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Paramètres
            </Link>
          </div>

          <hr className="border-0 h-px bg-bordeaux/10 mx-0" />

          {/* Déconnexion */}
          <div className="py-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-[11px] text-[13px] font-medium cursor-pointer text-highlight hover:bg-highlight/5 transition-colors"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
