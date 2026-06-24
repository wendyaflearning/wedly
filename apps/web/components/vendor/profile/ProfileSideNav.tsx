interface Steps {
  availability: boolean
  portfolio: boolean
  bio: boolean
  published: boolean
}

interface NavStep {
  num: string
  label: string
  done: boolean
  active: boolean
}

interface Props {
  steps: Steps
}

export function ProfileSideNav({ steps }: Props) {
  const navSteps: NavStep[] = [
    { num: '01', label: 'Identité', done: false, active: false },
    { num: '02', label: 'Présentation', done: steps.bio, active: true },
    { num: '03', label: 'Disponibilités', done: steps.availability, active: false },
    { num: '04', label: 'Portfolio', done: steps.portfolio, active: false },
    { num: '05', label: 'Tarifs', done: false, active: false },
    { num: '06', label: 'Vérification', done: steps.published, active: false },
  ]

  return (
    <nav className="hidden lg:block w-[220px] shrink-0 pt-2">
      <p className="font-manrope text-[10px] font-semibold tracking-[0.16em] uppercase text-bordeaux mb-6">
        Mon Profil
      </p>
      <ol className="space-y-5">
        {navSteps.map((step) => (
          <li key={step.num} className="flex items-center gap-3">
            <span className="font-manrope text-[11px] text-gris w-5 shrink-0">{step.num}</span>
            <span
              className={[
                'font-manrope text-sm',
                step.active
                  ? 'font-semibold text-bordeaux'
                  : step.done
                    ? 'text-texte'
                    : 'text-gris',
              ].join(' ')}
            >
              {step.label}
            </span>
            {step.active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-highlight shrink-0" />
            )}
            {!step.active && step.done && (
              <svg className="ml-auto w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7L5.5 10.5L12 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
