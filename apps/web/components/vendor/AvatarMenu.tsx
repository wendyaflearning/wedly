'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface AvatarMenuProps {
  firstName: string
  lastName: string
  direction?: 'down' | 'up'
  variant?: 'light' | 'dark'
}

export function AvatarMenu({ firstName, lastName, direction = 'down', variant = 'light' }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

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
          className={`absolute right-0 ${dropdownPosition} w-[200px] bg-creme border border-bordeaux rounded-lg overflow-hidden z-50`}
          style={{
            borderWidth: '0.5px',
            boxShadow: '0px 8px 28px rgba(41,26,16,0.20), 0px 2px 6px rgba(41,26,16,0.09)',
          }}
        >
          <Link
            href="/profil"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-[10px] px-4 py-[10px] text-[13px] font-medium text-texte no-underline hover:bg-bordeaux/5 transition-colors"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="#291A10" strokeWidth="1.25" />
              <path d="M1.5 13c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke="#291A10" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            Mon profil
          </Link>

          <Link
            href="/parametres"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-[10px] px-4 py-[10px] text-[13px] font-medium text-texte no-underline hover:bg-bordeaux/5 transition-colors"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" stroke="#291A10" strokeWidth="1.25" />
              <path d="M7 1.5V3M7 11v1.5M1.5 7H3M11 7h1.5" stroke="#291A10" strokeWidth="1.25" strokeLinecap="round" />
              <path d="M3.2 3.2l.95.95M9.85 9.85l.95.95M3.2 10.8l.95-.95M9.85 4.15l.95-.95" stroke="#291A10" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            Paramètres
          </Link>

          <hr className="border-0 h-px bg-bordeaux/15 my-0.5" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[10px] px-4 py-[10px] text-[13px] font-medium cursor-pointer text-highlight hover:bg-highlight/5 transition-colors"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.5 12H2.5a1 1 0 01-1-1V3a1 1 0 011-1H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" />
              <path d="M9.5 10l3-3-3-3M12.5 7H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
