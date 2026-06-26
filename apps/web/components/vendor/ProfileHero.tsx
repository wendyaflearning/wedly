import type { ReactNode } from 'react'
import Link from 'next/link'

interface ProfileHeroProps {
  breadcrumb: string
  title: ReactNode
  backHref?: string
}

export default function ProfileHero({ breadcrumb, title, backHref }: ProfileHeroProps) {
  return (
    <section className="bg-bordeaux text-creme px-5 pt-6 pb-8 md:px-[72px] md:pt-14 md:pb-16 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
      <div className="absolute -right-10 -top-10 w-32 h-32 md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 font-manrope text-[11px] tracking-[0.06em] text-creme/50 hover:text-creme/80 transition-colors mb-5 md:mb-8"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour à Mon Profil
          </Link>
        )}
        <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-creme/40 mb-3 md:mb-4">
          {breadcrumb}
        </p>
        <h1 className="font-cormorant text-[32px] md:text-[52px] font-light leading-tight text-creme">
          {title}
        </h1>
      </div>
    </section>
  )
}
