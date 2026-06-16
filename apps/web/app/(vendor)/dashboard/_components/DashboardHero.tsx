import type { ReactNode } from 'react'

interface DashboardHeroProps {
  firstName: string
}

export function DashboardHero({ firstName }: DashboardHeroProps) {
  return (
    <section className="bg-bordeaux text-creme px-[72px] pt-12 pb-14 relative overflow-hidden">
      {/* Cercles décoratifs */}
      <div className="absolute -right-30 -top-30 w-90 h-90 rounded-full border border-creme/10 pointer-events-none" />
      <div className="absolute -right-15 -top-15 w-60 h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

      {/* Header : titre + badge */}
      <div className="flex items-end justify-between mb-9 relative">
        <div>
          <span className="font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-creme/55">
            Tableau de bord · Premier accès
          </span>
          <h1
            className="font-cormorant font-light text-[56px] leading-none tracking-[-0.015em] text-creme mt-3.5"
          >
            Bienvenue,{' '}
            <em style={{ color: 'var(--color-dore)' }}>{firstName}.</em>
          </h1>
        </div>

        <div className="text-right">
          <span className="font-manrope text-[10px] font-medium tracking-[0.22em] uppercase text-creme/55">
            État du compte
          </span>
          <div className="mt-2 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-creme/[0.22] font-manrope text-xs font-medium tracking-[0.12em] uppercase text-creme">
            <span className="w-1.5 h-1.5 rounded-full bg-highlight" />
            Profil en préparation
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-creme/[0.14]">
        <StatBlock
          label="Couples vous ont liké"
          value="0"
          note="Vos premiers admirateurs arriveront bientôt."
        />
        <StatBlock
          label="Matches actifs"
          value="0"
          note="Un match, c'est un couple qui a hâte de vous parler."
          withLeftBorder
        />
        <StatBlock
          label="Likes restants aujourd'hui"
          value={
            <>
              5
              <span className="text-[40px] opacity-55 not-italic">/5</span>
            </>
          }
          note="Chaque jour, 5 chances de trouver un coup de cœur."
          withLeftBorder
        />
      </div>
    </section>
  )
}

function StatBlock({
  label,
  value,
  note,
  withLeftBorder = false,
}: {
  label: string
  value: ReactNode
  note: string
  withLeftBorder?: boolean
}) {
  return (
    <div
      className={`pt-8 pb-0 px-8 opacity-70 ${withLeftBorder ? 'border-l border-creme/[0.14]' : ''}`}
    >
      <span className="font-manrope text-[10px] font-medium tracking-[0.22em] uppercase text-creme/55">
        {label}
      </span>
      <div className="mt-[18px] font-cormorant italic font-light text-[96px] leading-[0.95] text-creme tracking-[-0.04em]">
        {value}
      </div>
      <p className="mt-3.5 font-cormorant italic font-light text-base leading-relaxed text-creme/72">
        {note}
      </p>
    </div>
  )
}
