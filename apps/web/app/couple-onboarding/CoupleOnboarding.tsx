'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ProgressIndicator from './ProgressIndicator'
import { canGoToPreviousMonth, isSelectableWeddingDate, selectableWeddingYears, setCalendarMonth, startOfDay } from './calendar'
import { canContinue, getContinueAction, type CoupleOnboardingScreen } from './navigation'
import {
  BUDGET_RANGES,
  budgetIndexForCents,
  budgetRangeForCents,
  type CoupleOnboardingData,
  DEFAULT_BUDGET_CENTS,
  DEFAULT_GUEST_COUNT,
  GUEST_COUNT_MAX,
  GUEST_COUNT_MIN,
  GUEST_COUNT_STEP,
  type PlanningStage,
  loadCoupleOnboarding,
  saveCoupleOnboarding,
  withSliderDefaults,
} from '@/lib/couple-onboarding-store'

const PLANNING_STAGES: Array<{ value: PlanningStage; label: string }> = [
  { value: 'just_started', label: 'On vient de commencer' },
  { value: 'in_progress', label: 'On est en plein dedans' },
  { value: 'almost_ready', label: 'On est presque prêts' },
]

const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthOptionsFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
const weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: monthOptionsFormatter.format(new Date(2026, month, 1)),
}))

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateFromValue(value?: string) {
  return value ? new Date(`${value}T12:00:00`) : undefined
}

function Calendar({
  value,
  onChange,
  today,
}: {
  value?: string
  onChange: (value: string) => void
  today: Date
}) {
  const selectedDate = dateFromValue(value)
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today)
  const days = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay() || 7
    const dayCount = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: firstDay - 1 + dayCount }, (_, index) => index < firstDay - 1 ? null : index - firstDay + 2)
  }, [visibleMonth])
  const years = useMemo(() => selectableWeddingYears(today), [today])

  function updateVisibleMonth(month: number) {
    setVisibleMonth((current) => setCalendarMonth(current.getFullYear(), month))
  }

  function updateVisibleYear(year: number) {
    setVisibleMonth((current) => setCalendarMonth(year, current.getMonth()))
  }

  return (
    <section aria-label="Date du mariage" className="w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" disabled={!canGoToPreviousMonth(visibleMonth, today)} className="rounded-full p-1 text-bordeaux hover:bg-bordeaux/10 disabled:cursor-not-allowed disabled:text-gris disabled:hover:bg-transparent" aria-label="Mois précédent" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft size={17} />
        </button>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="wedding-month">Mois du mariage</label>
          <select id="wedding-month" aria-label="Mois du mariage" value={visibleMonth.getMonth()} onChange={(event) => updateVisibleMonth(Number(event.target.value))} className="cursor-pointer rounded-md bg-transparent px-1 py-1 text-xs font-bold uppercase tracking-[0.12em] text-bordeaux outline-none focus-visible:ring-2 focus-visible:ring-bordeaux">
            {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="wedding-year">Année du mariage</label>
          <select id="wedding-year" aria-label="Année du mariage" value={visibleMonth.getFullYear()} onChange={(event) => updateVisibleYear(Number(event.target.value))} className="cursor-pointer rounded-md bg-transparent px-1 py-1 text-xs font-bold uppercase tracking-[0.12em] text-bordeaux outline-none focus-visible:ring-2 focus-visible:ring-bordeaux">
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
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
          const isSelectable = isSelectableWeddingDate(date, today)
          return (
            <button key={dateValue} type="button" disabled={!isSelectable} aria-pressed={isSelected} onClick={() => onChange(dateValue)} className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full transition ${isSelected ? 'bg-bordeaux font-semibold text-creme' : isSelectable ? 'hover:bg-bordeaux/10' : 'cursor-not-allowed text-gris/50'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}

const NAME_PLACEHOLDER = 'votre prénom'

/**
 * The first name is typed straight inside the headline, so the field has to grow
 * with what is typed. A hidden twin carries the exact same typography and gives
 * the width to copy — which keeps the input aligned at every responsive size.
 */
function NameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const sizer = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>()

  useEffect(() => {
    if (sizer.current) setWidth(sizer.current.offsetWidth + 12)
  }, [value])

  return (
    <span className="relative inline-block">
      <span aria-hidden="true" ref={sizer} className="invisible absolute left-0 top-0 whitespace-pre font-semibold italic">
        {value || NAME_PLACEHOLDER}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={NAME_PLACEHOLDER}
        aria-label="Votre prénom"
        style={{ width }}
        className="max-w-full border-b-2 border-bordeaux/20 bg-transparent text-center font-semibold italic text-accent outline-none transition-colors placeholder:font-normal placeholder:text-gris/60 focus:border-highlight"
      />
    </span>
  )
}

interface CoupleOnboardingProps {
  /**
   * The parent 7-step flow owns screens 3–7. Stage A only emits its complete,
   * in-memory data at the boundary so the next stage can continue without an API call.
   */
  onStageComplete?: (data: CoupleOnboardingData) => void
}

function emitStageAComplete(data: CoupleOnboardingData) {
  window.dispatchEvent(new CustomEvent('wedly:couple-onboarding-stage-a-complete', { detail: data }))
}

export default function CoupleOnboarding({ onStageComplete = emitStageAComplete }: CoupleOnboardingProps) {
  const [screen, setScreen] = useState<CoupleOnboardingScreen>(1)
  const [data, setData] = useState<CoupleOnboardingData>({})
  const [hydrated, setHydrated] = useState(false)
  const [today] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setData(withSliderDefaults(loadCoupleOnboarding(sessionStorage)))
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

  function continueOnboarding() {
    const action = getContinueAction(screen, withSliderDefaults(data))

    if (action.type === 'show_wedding_profile') {
      setScreen(2)
      return
    }

    onStageComplete(action.data)
  }

  const name = data.firstName?.trim()
  const canGoOn = canContinue(screen, data)
  const budgetCents = data.budgetCents ?? DEFAULT_BUDGET_CENTS
  const guestCount = data.guestCount ?? DEFAULT_GUEST_COUNT
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
              Bonjour <NameField value={data.firstName ?? ''} onChange={(value) => update('firstName', value)} />, vous en êtes où&nbsp;?
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
                <Calendar value={data.weddingDate} onChange={(value) => update('weddingDate', value)} today={today} />
                <p className="mt-2 font-cormorant text-xl italic text-accent">{dateLabel}</p>
              </div>
              <label className="flex flex-col gap-3 text-sm font-medium">
                Où souhaitez-vous vous marier&nbsp;?
                <input value={data.location ?? ''} onChange={(event) => update('location', event.target.value)} placeholder="Lyon" className="rounded-xl border border-bordeaux/20 bg-transparent px-4 py-3 text-base outline-none placeholder:text-gris focus:border-bordeaux" />
              </label>
              <div className="border-bordeaux/15 lg:border-l lg:pl-6">
                <label htmlFor="budget" className="text-sm font-medium">Quel budget imaginez-vous pour l&apos;ensemble du mariage&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl font-semibold text-accent">{budgetRangeForCents(budgetCents)}</p>
                <input id="budget" type="range" min="0" max={BUDGET_RANGES.length - 1} step="1" value={budgetIndexForCents(budgetCents)} onChange={(event) => update('budgetCents', BUDGET_RANGES[Number(event.target.value)].cents)} className="mt-3 w-full accent-accent" aria-label="Fourchette de budget" aria-valuetext={budgetRangeForCents(budgetCents)} />
                <p className="mt-3 text-xs italic text-gris">Pas encore sûrs ? Vous pourrez ajuster plus tard.</p>
              </div>
              <div className="border-bordeaux/15 lg:border-l lg:pl-6">
                <label htmlFor="guests" className="text-sm font-medium">Environ combien d&apos;invités&nbsp;?</label>
                <p className="mt-4 font-cormorant text-xl font-semibold text-accent">{guestCount} invités</p>
                <input id="guests" type="range" min={GUEST_COUNT_MIN} max={GUEST_COUNT_MAX} step={GUEST_COUNT_STEP} value={guestCount} onChange={(event) => update('guestCount', Number(event.target.value))} className="mt-3 w-full accent-accent" aria-label="Nombre d’invités" />
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 flex justify-center pb-2">
          <button type="button" disabled={!canGoOn} onClick={continueOnboarding} className="inline-flex items-center gap-2 rounded-full bg-highlight px-9 py-4 text-sm font-bold tracking-[0.13em] text-creme shadow-lg transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bordeaux disabled:cursor-not-allowed disabled:opacity-[0.32] disabled:shadow-none disabled:hover:bg-highlight">
            CONTINUER <ChevronRight size={18} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </main>
  )
}
