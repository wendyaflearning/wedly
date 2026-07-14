'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Sparkles, MessageSquare, User } from 'lucide-react'
import { AvatarMenu } from './AvatarMenu'
import { MobileNavSheet } from './MobileNavSheet'

interface VendorNavProps {
  vendorFirstName: string
  vendorLastName: string
  vendorEmail?: string
  vendorStatus?: string
}

export function VendorNav({ vendorFirstName, vendorLastName, vendorEmail, vendorStatus }: VendorNavProps) {
  const pathname = usePathname()
  const [isNavOpen, setIsNavOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  const desktopLink = (href: string, label: string) => (
    <Link
      href={href}
      className={[
        'text-[13px] font-medium tracking-[0.02em] pb-1 border-b-[1.5px] no-underline transition-colors',
        isActive(href) ? 'text-texte border-accent' : 'text-texte/55 border-transparent',
      ].join(' ')}
    >
      {label}
    </Link>
  )

  const lockedDesktopItem = (label: string) => (
    <span className="group relative text-[13px] font-medium tracking-[0.02em] pb-1 border-b-[1.5px] border-transparent text-texte/55 cursor-not-allowed">
      {label}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium bg-bordeaux text-creme rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10">
        Bientôt disponible
      </span>
    </span>
  )

  return (
    <>
      {/* ── Mobile Topbar ──────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 h-16 px-5 bg-bordeaux flex items-center justify-between">
        <Link href="/dashboard">
          <Image
            src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg"
            alt="Wedly"
            width={0}
            height={0}
            sizes="200px"
            style={{ height: '22px', width: 'auto' }}
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <AvatarMenu firstName={vendorFirstName} lastName={vendorLastName} email={vendorEmail} status={vendorStatus} variant="dark" />
          <button
            onClick={() => setIsNavOpen(true)}
            className="w-9 h-9 rounded-full border border-creme/20 flex items-center justify-center text-creme"
            aria-label="Menu de navigation"
          >
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <path d="M0 1h16M0 5.5h16M0 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Desktop Topbar ─────────────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-[72px] px-12 items-center justify-between bg-creme border-b border-bordeaux/10 font-manrope">

        <div className="flex items-center gap-14">
          {/* Logo */}
          <Link href="/dashboard">
            <Image
              src="https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_dark_bbyd6m.svg"
              alt="Wedly"
              width={0}
              height={0}
              sizes="300px"
              className="flex-shrink-0"
              style={{ height: '28px', width: 'auto' }}
              priority
            />
          </Link>

          {/* Nav links */}
          <nav className="flex gap-8">
            {desktopLink('/dashboard', 'Dashboard')}
            {lockedDesktopItem('Wedmatch')}
            {lockedDesktopItem('Matches & Messagerie')}
            {desktopLink('/dashboard/profile', 'Mon Profil')}
            {desktopLink('/parametres', 'Paramètres')}
          </nav>
        </div>

        {/* Right: Help + Avatar */}
        <div className="flex items-center gap-5">
          <AvatarMenu firstName={vendorFirstName} lastName={vendorLastName} email={vendorEmail} status={vendorStatus} />
        </div>
      </header>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[72px] pt-2 pb-4 px-2 bg-creme border-t border-bordeaux/10 grid grid-cols-4 font-manrope">

        <Link
          href="/dashboard"
          className={`relative flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg no-underline ${isActive('/dashboard') ? 'text-accent' : 'text-texte/55'}`}
        >
          {isActive('/dashboard') && (
            <span
              className="absolute top-0 w-[22px] h-0.5 bg-accent rounded-full"
              style={{ transform: 'translateY(-9px)' }}
            />
          )}
          <Home size={20} strokeWidth={1.4} />
          <span className="text-[10px] font-semibold tracking-[0.02em]">Accueil</span>
        </Link>

        <div className="flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg text-texte/55 cursor-default">
          <Sparkles size={20} strokeWidth={1.4} />
          <span className="text-[10px] font-medium tracking-[0.02em]">Wedmatch</span>
        </div>

        <div className="flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg text-texte/55 cursor-default">
          <MessageSquare size={20} strokeWidth={1.4} />
          <span className="text-[10px] font-medium tracking-[0.02em]">Messages</span>
        </div>

        <Link
          href="/dashboard/profile"
          className={`relative flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg no-underline ${isActive('/dashboard/profile') ? 'text-accent' : 'text-texte/55'}`}
        >
          {isActive('/dashboard/profile') && (
            <span
              className="absolute top-0 w-[22px] h-0.5 bg-accent rounded-full"
              style={{ transform: 'translateY(-9px)' }}
            />
          )}
          <User size={20} strokeWidth={1.4} />
          <span className="text-[10px] font-medium tracking-[0.02em]">Profil</span>
        </Link>

      </nav>

      <MobileNavSheet isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
    </>
  )
}
