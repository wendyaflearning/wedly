interface Sections {
  general_info: boolean
  pricing_zone: boolean
  experiences: boolean
  bio: boolean
  portfolio: boolean
  booking_blocker: boolean
}

interface DashboardStepsProps {
  sections: Sections
}

const STEPS = [
  {
    number: '01',
    icon: <CalendarIcon />,
    title: 'Renseignez vos disponibilités',
    description: 'Bloquez les dates déjà prises, ouvrez celles à venir.',
    href: '/dashboard/profile/booking-blocker',
  },
  {
    number: '02',
    icon: <ImageIcon />,
    title: 'Ajoutez vos photos de portfolio',
    description: '5 à 12 images — les couples décident souvent en images.',
    href: '/dashboard/profile/portfolio',
  },
  {
    number: '03',
    icon: <DocumentIcon />,
    title: 'Complétez votre bio',
    description: 'Quelques lignes sur votre approche et votre univers.',
    href: '/dashboard/profile/bio',
  },
  {
    number: '04',
    icon: <CheckCircleIcon />,
    title: 'Vérifiez et publiez votre profil',
    description: 'Dernier coup d\'œil, puis vous apparaissez en Wedmatch.',
    href: null,
  },
]

export function DashboardSteps({ sections }: DashboardStepsProps) {
  const completedCount = [
    sections.booking_blocker,
    sections.portfolio,
    sections.bio,
    sections.general_info && sections.pricing_zone && sections.experiences,
  ].filter(Boolean).length

  const progressWidth = `${(completedCount / 4) * 100}%`

  return (
    <section className="px-5 py-7 md:px-[72px] md:py-14">
      {/* Header mobile */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between mb-0">
          <span className="font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-accent">
            Premières étapes
          </span>
          <span className="font-manrope text-[10px] font-medium tracking-[0.22em] uppercase text-texte/55">
            {completedCount} / 4
          </span>
        </div>
        <h2 className="font-cormorant font-light text-[24px] mt-2 mb-1.5 text-texte tracking-[-0.01em] leading-[1.15]">
          Quatre gestes{' '}
          <em className="text-accent">pour démarrer.</em>
        </h2>
        <div className="w-[90px] h-0.5 bg-bordeaux/10 mt-3.5 mb-2">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: progressWidth }} />
        </div>
      </div>

      {/* Header desktop */}
      <div className="hidden md:flex items-baseline justify-between mb-8">
        <div>
          <span className="font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-accent">
            Premières étapes
          </span>
          <h2 className="font-cormorant font-light text-[36px] mt-3 text-texte tracking-[-0.01em]">
            Quatre gestes{' '}
            <em className="text-accent">pour démarrer.</em>
          </h2>
        </div>
        <div className="text-right">
          <span className="font-manrope text-[11px] font-medium tracking-[0.22em] uppercase text-texte/55">
            Progression
          </span>
          <div className="mt-2.5 w-[200px] h-0.5 bg-bordeaux/10">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: progressWidth }} />
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="relative mt-4 md:mt-0">
        <div className="absolute left-[18px] md:left-[54px] top-8 bottom-8 w-px bg-bordeaux/[0.18]" />

        {STEPS.map((step) => {
          const Wrapper = step.href ? 'a' : 'div'
          const wrapperProps = step.href ? { href: step.href } : {}

          return (
            <Wrapper
              key={step.number}
              {...wrapperProps}
              className="group grid grid-cols-[40px_1fr_16px] md:grid-cols-[76px_1fr_auto] items-center gap-3.5 md:gap-8 py-[18px] px-0 md:px-4 md:py-5 rounded md:hover:bg-bordeaux/5 md:transition-colors no-underline text-inherit cursor-pointer focus-visible:outline-none"
            >
              {/* Numéro */}
              <div className="w-[38px] h-[38px] md:w-[76px] md:h-[76px] relative flex items-center justify-center bg-creme md:group-hover:bg-[#F6EBE4] md:transition-colors z-10">
                <div className="absolute inset-0 rounded-full border border-bordeaux/[0.18]" />
                <span className="font-cormorant italic font-light text-[18px] md:text-[38px] text-accent tracking-[-0.03em] md:tracking-[-0.04em] leading-none">
                  {step.number}
                </span>
              </div>

              {/* Contenu */}
              <div className="flex items-center gap-6">
                <div className="hidden md:block flex-shrink-0 opacity-85">{step.icon}</div>
                <div>
                  <div className="font-cormorant font-normal text-[16px] md:text-[26px] text-texte mb-0.5 md:mb-1 tracking-[-0.005em] md:tracking-[-0.01em] leading-[1.2] md:leading-normal">
                    {step.title}
                  </div>
                  <div className="font-manrope text-[11px] md:text-[13px] text-texte/55 leading-[1.45] md:leading-relaxed">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <span className="inline-flex items-center gap-0 md:gap-2.5 font-manrope text-[11px] font-semibold tracking-[0.18em] uppercase text-accent">
                <span className="hidden md:inline">Commencer </span>
                <ArrowRightIcon />
              </span>
            </Wrapper>
          )
        })}
      </div>
    </section>
  )
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="18" rx="2" stroke="#4E1A32" strokeWidth="1.3" />
      <path d="M4 11h20" stroke="#4E1A32" strokeWidth="1.3" />
      <path d="M9 3v5M19 3v5" stroke="#4E1A32" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14" cy="17" r="1.5" fill="#4E1A32" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="6" width="22" height="17" rx="2" stroke="#4E1A32" strokeWidth="1.3" />
      <circle cx="10" cy="12" r="2" stroke="#4E1A32" strokeWidth="1.3" />
      <path d="M3 19l6-5 5 4 4-3 7 5" stroke="#4E1A32" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M6 3h12l4 4v18H6V3z" stroke="#4E1A32" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M18 3v4h4" stroke="#4E1A32" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 13h8M10 17h8M10 21h5" stroke="#4E1A32" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" stroke="#4E1A32" strokeWidth="1.3" />
      <path d="M9 14l3.5 3.5L20 10" stroke="#4E1A32" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="#9D4F1E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
