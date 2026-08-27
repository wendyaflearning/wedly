'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const DEFAULT_PHASE_DURATION_MS = 2200

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export type JourneyPhase = {
  key: string
  /** Rendu au centre de la scène blanche. */
  content: React.ReactNode
  /** Légende affichée sous la scène ; change avec la phase active. */
  legend: React.ReactNode
}

interface WedreamJourneyPreviewProps {
  phases: JourneyPhase[]
  title: string
  /** Pastille en haut à gauche. Aucune pastille si la prop est omise. */
  badgeLabel?: string
  phaseDurationMs?: number
  showProgressDots?: boolean
  className?: string
}

/**
 * Orchestrateur d'une preview animée en N phases : phase active, transition, boucle,
 * points de progression. Il ne connaît RIEN du contenu affiché — chaque phase est
 * injectée par l'appelant via `phases`, ce qui permet de le réutiliser avec un contenu
 * réel (dashboard prestataire) comme générique (guide prestataire, WED-122).
 *
 * Chaque phase reçoit `data-active` : c'est le seul crochet dont un contenu injecté a
 * besoin pour rejouer une animation à chaque passage (cf. `.wedream-heart-pop`).
 */
export function WedreamJourneyPreview({
  phases,
  title,
  badgeLabel,
  phaseDurationMs = DEFAULT_PHASE_DURATION_MS,
  showProgressDots = true,
  className,
}: WedreamJourneyPreviewProps) {
  const phaseCount = phases.length
  const [tick, setTick] = useState(0)

  // Rendu serveur : on part du principe qu'il n'y a pas de préférence « mouvement
  // réduit », l'hydratation corrige au premier rendu client si besoin.
  const reduceMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, () => false)

  useEffect(() => {
    if (phaseCount <= 1) return

    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer !== null) return
      timer = setInterval(() => setTick((current) => current + 1), phaseDurationMs)
    }

    const stop = () => {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    }

    // Onglet masqué : inutile de faire tourner la boucle en arrière-plan.
    const onVisibilityChange = () => (document.hidden ? stop() : start())

    start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [phaseCount, phaseDurationMs])

  if (phaseCount === 0) return null

  // Index dérivé du compteur : reste dans les bornes même si le nombre de phases
  // change, sans avoir à remettre un état à zéro dans un effet.
  const activeIndex = tick % phaseCount
  const activePhase = phases[activeIndex]

  return (
    <section
      aria-label={title}
      className={[
        'relative flex flex-col bg-creme rounded-[20px] border border-bordeaux/[0.12] p-7',
        className ?? '',
      ].join(' ')}
    >
      {badgeLabel && (
        <span className="absolute -top-2.5 left-4 bg-accent text-creme text-[9px] font-bold tracking-[0.12em] uppercase px-3 py-[5px] rounded-full">
          {badgeLabel}
        </span>
      )}

      <p className="font-cormorant font-medium text-[15px] tracking-[-0.01em] text-bordeaux mt-2.5 mb-[18px]">
        {title}
      </p>

      <div className="relative flex-1 min-h-[150px] rounded-[10px] bg-white border border-bordeaux/[0.08] overflow-hidden">
        {phases.map((phase, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={phase.key}
              data-active={isActive}
              aria-hidden={!isActive}
              className={[
                'wedream-journey-phase absolute inset-0 flex flex-col items-center justify-center gap-2',
                'pointer-events-none transition-[opacity,transform] duration-500 ease-out',
                reduceMotion
                  ? isActive ? 'opacity-100' : 'opacity-0'
                  : isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]',
              ].join(' ')}
            >
              {phase.content}
            </div>
          )
        })}
      </div>

      {showProgressDots && phaseCount > 1 && (
        <div aria-hidden="true" className="flex items-center justify-center gap-[5px] mt-3.5">
          {phases.map((phase, index) => (
            <span
              key={phase.key}
              className={[
                'w-[5px] h-[5px] rounded-full transition-colors duration-300',
                index === activeIndex ? 'bg-accent' : 'bg-bordeaux/[0.18]',
              ].join(' ')}
            />
          ))}
        </div>
      )}

      <p className="text-center text-[11.5px] leading-[1.5] text-texte/55 mt-2">
        {activePhase.legend}
      </p>
    </section>
  )
}
