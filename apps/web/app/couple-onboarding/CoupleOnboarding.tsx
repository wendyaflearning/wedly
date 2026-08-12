'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ProgressIndicator from './ProgressIndicator'
import {
  BUDGET_RANGES,
  budgetRangeForCents,
  type CoupleOnboardingData,
  type PlanningStage,
  loadCoupleOnboarding,
  saveCoupleOnboarding,
} from '@/lib/couple-onboarding-store'

const PLANNING_STAGES: Array<{ value: PlanningStage; label: string }> = [
  { value: 'just_started', label: 'On vient de commencer' },
  { value: 'in_progress', label: 'On est en plein dedans' },
  { value: 'almost_ready', label: 'On est presque prêts' },
]

const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateFromValue(value?: string) {
  return value ? new Date(`${value}T12:00:00`) : undefined
}

function Calendar({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const selectedDate = dateFromValue(value)
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date())
  const days = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay() || 7
    const dayCount = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: firstDay - 1 + dayCount }, (_, index) => index < firstDay - 1 ? null : index - firstDay + 2)
  }, [visibleMonth])

  return (
    <section aria-label="Date du mariage" className="w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="rounded-full p-1 text-bordeaux hover:bg-bordeaux/10" aria-label="Mois précédent" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft size={17} />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-bordeaux">{monthFormatter.format(visibleMonth)}</p>
        <button type="button" className="rounded-full p-1 text-bordeaux hover:bg-bordeaux/10" aria-label="Mois suivant" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-texte">
        {weekdayLabels.map((label, index) => <span className="pb-2 font-semibold text-gris" key={`${label}-${index}`}>{label}</span>)}
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />
          const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
          const dateValue = toDateInputValue(date)
          const isSelected = value === dateValue
          return (
            <button key={dateValue} type="button" aria-pressed={isSelected} onClick={() => onChange(dateValue)} className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full transition ${isSelected ? 'bg-bordeaux font-semibold text-creme' : 'hover:bg-bordeaux/10'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function CoupleOnboarding() {
  const [screen, setScreen] = useState<1 | 2>(1)
  const [data, setData] = useState<CoupleOnboardingData>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setData(loadCoupleOnboarding(sessionStorage))
      setHydrated(true)
    }, 0)

    return () => window.clearTimeout(hydration)
  }, [])

  useEffect(() => {
    if (hydrated) saveCoupleOnboarding(sessionStorage, data)
  }, [data, hydrated])

  function update<K extends keyof CoupleOnboardingData>(key: K, value: CoupleOnboardingData[K]) {
    setData((current) => ({ ...current, [key]: value }))
  }

  const name = data.firstName?.trim()
  const selectedBudgetIndex = Math.max(0, BUDGET_RANGES.findIndex((range) => range.cents === data.budgetCents))
  const dateLabel = data.weddingDate ? formatter.format(dateFromValue(data.weddingDate)!) : 'Choisissez une date'

  return (
    <main className="min-h-screen overflow-hidden bg-creme px-6 py-8 sm:px-12 lg:px-20">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <ProgressIndicator currentStep={screen} />
          {screen === 2 && <button type="button" onClick={() => setScreen(1)} className="inline-flex items-center gap-1 text-sm text-bordeaux underline-offset-4 hover:underline"><ChevronLeft size={16} />Retour</button>}
        </header>

        {screen === 1 ? (
          <section className="m-auto w-full text-center">
            <h1 className="font-cormorant text-4xl font-medium tracking-tight text-texte sm:text-5xl lg:text-6xl">
              {name ? <>Bonjour <em className="font-semibold text-accent">{name}</em>, vous en êtes où&nbsp;?</> : <>Bonjour, vous en êtes où&nbsp;?</>}
            </h1>
            <div className="mx-auto mt-12 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row" role="radiogroup" aria-label="Avancement de l’organisation">
              {PLANNING_STAGES.map((stage) => {
                const isSelected = data.planningStage === stage.value
                return <button key={stage.value} type="button" role="radio" aria-checked={isSelected} onClick={() => update('planningStage', stage.value)} className={`rounded-full border px-7 py-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordeaux ${isSelected ? 'border-bordeaux bg-bordeaux text-creme' : 'border-bordeaux/20 bg-creme text-texte hover:border-bordeaux'}`}>{stage.label}</button>
              })}
            </div>
          </section>
        ) : (
          <section className="m-auto w-full">
            <h1 className="text-center font-cormorant text-4xl font-medium tracking-tight text-texte sm:text-5xl lg:text-6xl">
              {name ? <>Alors {name}, c&apos;est <em className="font-semibold text-accent">pour quand&nbsp;?</em></> : <>Alors, c&apos;est <em className="font-semibold text-accent">pour quand&nbsp;?</em></>}
            </h1>
            <div className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr_1fr_1fr] lg:items-end lg:gap-6">
              <div className="flex flex-col items-center border-bordeaux/15 lg:border-r lg:pr-6">
                <Calendar value={data.weddingDate} onChange={(value) => update('weddingDate', value)} />
                <p className="mt-2 font-cormorant text-xl italic text-accent">{dateLabel}</p>
              </div>
              <label className="flex flex-col gap-3 text-sm font-medium">
                Où souhaitez-vous vous marier&nbsp;?
                <input value={data.location ?? ''} onChange={(event) => update('location', event.target.value)} placeholder="Lyon" className="rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 text-base outline-none placeholder:text-gris focus:border-bordeaux" />
              </label>
              <div className="border-bordeaux/15 lg:border-l lg:pl-6">
                <label htmlFor="budget" className="text-sm font-medium">Quel budget imaginez-vous pour l&apos;ensemble du mariage&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl text-accent">{budgetRangeForCents(data.budgetCents) ?? 'Choisissez une fourchette'}</p>
                <input id="budget" type="range" min="0" max={BUDGET_RANGES.length - 1} step="1" value={selectedBudgetIndex} onChange={(event) => update('budgetCents', BUDGET_RANGES[Number(event.target.value)].cents)} className="mt-3 w-full accent-accent" aria-label="Fourchette de budget" />
                <p className="mt-3 text-xs italic text-gris">Pas encore sûrs ? Vous pourrez ajuster plus tard.</p>
              </div>
              <div className="border-bordeaux/15 lg:border-l lg:pl-6">
                <label htmlFor="guests" className="text-sm font-medium">Environ combien d&apos;invités&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl text-accent">{data.guestCount ? `${data.guestCount} invités` : 'Choisissez un nombre'}</p>
                <input id="guests" type="range" min="0" max="300" step="10" value={data.guestCount ?? 0} onChange={(event) => update('guestCount', Number(event.target.value) || undefined)} className="mt-3 w-full accent-accent" aria-label="Nombre d’invités" />
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 flex justify-center pb-2">
          <button type="button" onClick={() => setScreen(2)} className="inline-flex items-center gap-2 rounded-full bg-highlight px-9 py-4 text-sm font-bold tracking-[0.13em] text-creme shadow-lg transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bordeaux">
            CONTINUER <ChevronRight size={18} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </main>
  )
}
