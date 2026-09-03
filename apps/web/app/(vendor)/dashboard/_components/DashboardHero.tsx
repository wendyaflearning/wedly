import type { ReactNode } from 'react'

interface DashboardHeroProps {
  firstName: string
  isPublished: boolean
  guideButton?: ReactNode
  desktopGuideButton?: ReactNode
}

export function DashboardHero({ firstName, isPublished, guideButton, desktopGuideButton }: DashboardHeroProps) {
  const mobileEyebrow = isPublished ? 'Tableau de bord' : 'Premier accès'
  const desktopEyebrow = isPublished ? 'Tableau de bord' : 'Tableau de bord · Premier accès'
  const statusLabel = isPublished ? 'Profil publié' : 'Profil en préparation'

  return (
    <section className="bg-bordeaux text-creme px-5 pt-6 pb-7 md:px-[72px] md:pt-12 md:pb-14 relative overflow-hidden">
      {/* Cercles décoratifs */}
      <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
      <div className="absolute -right-10 -top-10 w-[130px] h-[130px] md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

      {/* Header */}
      <div className="md:flex md:items-end md:justify-between mb-0 md:mb-9 relative">
        <div>
          {/* Eyebrow — deux variantes */}
          <span className="md:hidden font-manrope text-[10px] font-medium tracking-[0.22em] uppercase text-creme/55">
            {mobileEyebrow}
          </span>
          <span className="hidden md:inline font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-creme/55">
            {desktopEyebrow}
          </span>

          <h1 className="font-cormorant font-light text-[34px] md:text-[56px] leading-none tracking-[-0.015em] text-creme mt-2.5 mb-[18px] md:mt-3.5 md:mb-0">
            Bienvenue,{' '}
            <em style={{ color: 'var(--color-dore)' }}>{firstName}.</em>
          </h1>

          {/* Badge mobile + bouton guide côte à côte */}
          <div className="md:hidden flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-creme/[0.22] font-manrope text-[10px] font-medium tracking-[0.12em] uppercase text-creme">
              <span className={`w-[5px] h-[5px] rounded-full ${isPublished ? 'bg-highlight' : 'bg-dore'}`} />
              {statusLabel}
            </div>
            {guideButton}
          </div>
        </div>

        {/* Colonne droite desktop — badge + bouton guide côte à côte */}
        <div className="hidden md:flex items-center gap-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-creme/[0.22] font-manrope text-xs font-medium tracking-[0.12em] uppercase text-creme">
            <span className="w-1.5 h-1.5 rounded-full bg-highlight" />
            {statusLabel}
          </div>
          {desktopGuideButton}
        </div>
      </div>

      {/* Stats mobile */}
      <div className="md:hidden mt-[22px] pt-[18px] grid grid-cols-3 border-t border-creme/[0.14]">
        <MobileStatBlock ordinal="01" value="0" label="Couples vous ont liké" />
        <MobileStatBlock ordinal="02" value="0" label="Matches actifs" withLeftBorder />
        <MobileStatBlock
          ordinal="03"
          value={<>5<span className="text-[16px] opacity-55 not-italic">/5</span></>}
          label="Likes restants aujourd'hui"
          withLeftBorder
        />
      </div>

      {/* Stats desktop */}
      <div className="hidden md:grid grid-cols-3 border-t border-creme/[0.14]">
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

function MobileStatBlock({
  ordinal,
  value,
  label,
  withLeftBorder = false,
}: {
  ordinal: string
  value: ReactNode
  label: string
  withLeftBorder?: boolean
}) {
  return (
    <div
      className={`py-1 pr-2.5 opacity-[0.78] ${withLeftBorder ? 'pl-3 border-l border-creme/[0.14]' : 'pl-0'}`}
    >
      <span className="font-manrope text-[8px] font-medium tracking-[0.22em] uppercase text-creme/55">
        {ordinal}
      </span>
      <div className="mt-2 font-cormorant italic font-light text-[42px] leading-[0.9] text-creme tracking-[-0.04em]">
        {value}
      </div>
      <div className="mt-1.5 font-manrope text-[10px] font-medium text-creme/72 leading-[1.3]">
        {label}
      </div>
    </div>
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
