'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingBlocker } from '@/lib/availability'
import MonthGrid from './MonthGrid'
import MonthTimeline from './MonthTimeline'

interface Steps {
  availability: boolean
  portfolio: boolean
  bio: boolean
  published: boolean
}

interface AvailabilityCalendarProps {
  initialBlockers: BookingBlocker[]
  steps: Steps
}

const PROFILE_STEPS = [
  { label: 'Identité' },
  { label: 'Présentation' },
  { label: 'Disponibilités' },
  { label: 'Portfolio' },
  { label: 'Tarifs' },
  { label: 'Vérification' },
]

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function expandBlockers(blockers: BookingBlocker[]): Set<string> {
  const dates = new Set<string>()
  for (const b of blockers) {
    const start = new Date(b.date_start + 'T00:00:00')
    const end = new Date(b.date_end + 'T00:00:00')
    const cur = new Date(start)
    while (cur <= end) {
      dates.add(toDateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }
  }
  return dates
}

function getTimelineMonths(today: Date) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
}

function countBlockedInMonth(
  confirmedDates: Set<string>,
  pendingAddDates: Set<string>,
  year: number,
  month: number
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (confirmedDates.has(d) || pendingAddDates.has(d)) count++
  }
  return count
}

export default function AvailabilityCalendar({
  initialBlockers,
  steps,
}: AvailabilityCalendarProps) {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => toDateStr(today), [today])

  const maxDate = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + 12, 0)
    return toDateStr(d)
  }, [today])

  const timelineMonths = useMemo(() => getTimelineMonths(today), [today])

  const [blockers, setBlockers] = useState<BookingBlocker[]>(initialBlockers)
  const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set())
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set())
  const [activeMonthIndex, setActiveMonthIndex] = useState(0)
  const [savingMode, setSavingMode] = useState<'save' | 'continue' | null>(null)

  const confirmedDates = useMemo(() => {
    const activeBlockers = blockers.filter((b) => !pendingRemoveIds.has(b.id))
    return expandBlockers(activeBlockers)
  }, [blockers, pendingRemoveIds])

  const hasChanges = pendingAdd.size > 0 || pendingRemoveIds.size > 0
  const isSaving = savingMode !== null
  const pendingCount = pendingAdd.size + pendingRemoveIds.size

  function handleDayClick(dateStr: string) {
    if (pendingAdd.has(dateStr)) {
      setPendingAdd((prev) => {
        const s = new Set(prev)
        s.delete(dateStr)
        return s
      })
      return
    }

    const coveringBlocker = blockers.find((b) => {
      const start = new Date(b.date_start + 'T00:00:00')
      const end = new Date(b.date_end + 'T00:00:00')
      const d = new Date(dateStr + 'T00:00:00')
      return d >= start && d <= end
    })

    if (coveringBlocker) {
      setPendingRemoveIds((prev) => {
        const s = new Set(prev)
        if (s.has(coveringBlocker.id)) s.delete(coveringBlocker.id)
        else s.add(coveringBlocker.id)
        return s
      })
    } else {
      setPendingAdd((prev) => new Set([...prev, dateStr]))
    }
  }

  async function handleSave(mode: 'save' | 'continue') {
    if (isSaving) return
    setSavingMode(mode)

    try {
      if (hasChanges) {
        const addPromises = Array.from(pendingAdd).map((dateStr) =>
          fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date_start: dateStr, date_end: dateStr }),
          })
        )

        const removePromises = Array.from(pendingRemoveIds).map((blockerId) =>
          fetch(`/api/availability/${blockerId}`, { method: 'DELETE' })
        )

        await Promise.all([...addPromises, ...removePromises])

        const res = await fetch('/api/availability')
        if (res.ok) {
          const newBlockers: BookingBlocker[] = await res.json()
          setBlockers(newBlockers)
        }

        setPendingAdd(new Set())
        setPendingRemoveIds(new Set())
      }

      if (mode === 'continue') {
        router.push('/dashboard/portfolio')
      }
    } finally {
      setSavingMode(null)
    }
  }

  const month1 = timelineMonths[activeMonthIndex]
  const month2 = timelineMonths[Math.min(activeMonthIndex + 1, 11)]
  const showTwoMonths = activeMonthIndex < 11

  const blocked1 = useMemo(
    () => countBlockedInMonth(confirmedDates, pendingAdd, month1.year, month1.month),
    [confirmedDates, pendingAdd, month1]
  )
  const blocked2 = useMemo(
    () => (showTwoMonths ? countBlockedInMonth(confirmedDates, pendingAdd, month2.year, month2.month) : 0),
    [confirmedDates, pendingAdd, month2, showTwoMonths]
  )

  return (
    <>
      {/* ── Mobile step tabs ─────────────────────────────────────────────── */}
      <div
        className="md:hidden flex overflow-x-auto border-b border-bordeaux/[0.10] bg-creme"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PROFILE_STEPS.map(({ label }, i) => {
          const num = i + 1
          const isActive = num === 3
          const isDone = num <= 2
          return (
            <div
              key={i}
              className={`shrink-0 px-4 py-3 text-[13px] border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-texte text-texte font-semibold'
                  : 'border-transparent text-gris'
              }`}
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              {label}
              {isDone && (
                <svg className="inline ml-1 w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[72px] py-6 md:py-14 flex gap-10 md:gap-14">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-56 shrink-0">
          <p
            className="text-[10px] tracking-[0.22em] uppercase text-gris mb-5"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            MON PROFIL
          </p>
          <nav className="space-y-0">
            {PROFILE_STEPS.map(({ label }, i) => {
              const num = i + 1
              const isActive = num === 3
              const isDone = (num === 1) || (num === 2 && steps.bio) || (num === 3 && steps.availability)
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between py-3 border-b border-bordeaux/[0.08] ${isActive ? 'text-texte' : 'text-gris'}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] ${isActive ? 'text-accent' : 'text-gris/50'}`}
                      style={{ fontFamily: 'var(--font-manrope-var)' }}
                    >
                      {String(num).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-sm ${isActive ? 'font-semibold text-texte' : 'text-gris'}`}
                      style={{ fontFamily: 'var(--font-manrope-var)' }}
                    >
                      {label}
                    </span>
                  </div>
                  {isDone && !isActive && (
                    <svg className="w-3.5 h-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Center */}
        <div className="flex-1 min-w-0">
          <p
            className="hidden md:block text-[10px] tracking-[0.22em] uppercase text-gris mb-6"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            ÉTAPE 03 · MON PROFIL
          </p>

          <MonthTimeline
            months={timelineMonths}
            activeIndex={activeMonthIndex}
            onSelect={setActiveMonthIndex}
          />

          {/* ── Mobile : single month ──────────────────────────────────── */}
          <div className="md:hidden mt-5">
            <MonthGrid
              year={month1.year}
              month={month1.month}
              confirmedDates={confirmedDates}
              pendingAddDates={pendingAdd}
              todayStr={todayStr}
              maxDateStr={maxDate}
              blockedInMonth={blocked1}
              onDayClick={handleDayClick}
            />
          </div>

          {/* ── Desktop : two months ───────────────────────────────────── */}
          <div className="hidden md:flex gap-4 mt-6">
            <MonthGrid
              year={month1.year}
              month={month1.month}
              confirmedDates={confirmedDates}
              pendingAddDates={pendingAdd}
              todayStr={todayStr}
              maxDateStr={maxDate}
              blockedInMonth={blocked1}
              onDayClick={handleDayClick}
            />
            {showTwoMonths && (
              <MonthGrid
                year={month2.year}
                month={month2.month}
                confirmedDates={confirmedDates}
                pendingAddDates={pendingAdd}
                todayStr={todayStr}
                maxDateStr={maxDate}
                blockedInMonth={blocked2}
                onDayClick={handleDayClick}
              />
            )}
          </div>

          {/* ── Mobile CTA ─────────────────────────────────────────────── */}
          <div className="md:hidden mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleSave('continue')}
              disabled={isSaving}
              className="w-full py-4 bg-accent text-creme rounded-full text-[12px] font-semibold tracking-[0.18em] uppercase disabled:opacity-50"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              {savingMode === 'continue' ? 'Enregistrement…' : 'Continuer · Étape 04 →'}
            </button>
            {hasChanges && (
              <p
                className="text-center text-[11px] text-gris"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {pendingCount} modification{pendingCount > 1 ? 's' : ''} non enregistrée{pendingCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* ── Desktop footer ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center justify-between mt-8 pt-5 border-t border-bordeaux/[0.08]">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasChanges ? 'bg-accent' : 'bg-gris/40'}`} />
              <span
                className="text-[10px] tracking-[0.16em] uppercase text-gris"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {hasChanges
                  ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} non enregistrée${pendingCount > 1 ? 's' : ''}`
                  : 'Disponibilités à jour'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave('save')}
                disabled={!hasChanges || isSaving}
                className="px-5 py-2 text-[11px] tracking-[0.12em] uppercase border border-bordeaux text-bordeaux rounded-full transition-colors hover:bg-bordeaux hover:text-creme disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {savingMode === 'save' ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('continue')}
                disabled={!hasChanges || isSaving}
                className="px-5 py-2 text-[11px] tracking-[0.12em] uppercase bg-accent text-creme rounded-full transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {savingMode === 'continue' ? 'Enregistrement…' : 'Enregistrer et continuer →'}
              </button>
            </div>
          </div>
        </div>

        {/* Info card — desktop only */}
        <aside className="hidden lg:block w-48 shrink-0 pt-10">
          <div className="border-l-2 border-accent pl-4">
            <p
              className="text-[9px] tracking-[0.18em] uppercase text-texte mb-3"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              Vos jours sont libres
            </p>
            <p
              className="text-texte text-[15px] leading-relaxed mb-4 italic font-light"
              style={{ fontFamily: 'var(--font-cormorant-var)' }}
            >
              Cliquez sur un jour pour signaler qu'il est{' '}
              <em style={{ color: 'var(--color-accent)' }}>déjà pris</em>{' '}
              — vous pouvez revenir dessus à tout moment.
            </p>
            <p
              className="text-gris text-xs leading-relaxed"
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              Les couples ne verront jamais ces dates — uniquement vos jours ouverts.
            </p>
          </div>

          <div className="mt-8 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full border border-bordeaux/20 shrink-0" />
              <span
                className="text-[11px] text-gris uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                Libre
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-bordeaux/60 shrink-0" />
              <span
                className="text-[11px] text-gris uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                En attente
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-bordeaux shrink-0" />
              <span
                className="text-[11px] text-gris uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                Indisponible
              </span>
            </div>
          </div>
        </aside>

      </div>
    </>
  )
}
