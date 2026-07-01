'use client'

import { useState, useMemo } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import type { BookingBlocker } from '@/lib/availability'
import MonthGrid from './MonthGrid'
import MonthTimeline from './MonthTimeline'

interface AvailabilityCalendarProps {
  initialBlockers: BookingBlocker[]
}

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
}: AvailabilityCalendarProps) {
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
  const [isSaving, setIsSaving] = useState(false)
  const { toast, showToast } = useToast()

  const confirmedDates = useMemo(() => {
    const activeBlockers = blockers.filter((b) => !pendingRemoveIds.has(b.id))
    return expandBlockers(activeBlockers)
  }, [blockers, pendingRemoveIds])

  const hasChanges = pendingAdd.size > 0 || pendingRemoveIds.size > 0

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

  function handleCancel() {
    setPendingAdd(new Set())
    setPendingRemoveIds(new Set())
  }

  async function handleSave() {
    if (isSaving || !hasChanges) return
    setIsSaving(true)

    try {
      const addPromises = Array.from(pendingAdd).map((dateStr) =>
        fetch('/api/booking-blockers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date_start: dateStr, date_end: dateStr }),
        })
      )

      const removePromises = Array.from(pendingRemoveIds).map((blockerId) =>
        fetch(`/api/booking-blockers/${blockerId}`, { method: 'DELETE' })
      )

      const responses = await Promise.all([...addPromises, ...removePromises])
      if (responses.some((res) => !res.ok)) {
        showToast('error', 'Une erreur est survenue. Vos modifications ne sont pas enregistrées.')
        return
      }

      const res = await fetch('/api/booking-blockers')
      if (res.ok) {
        const newBlockers: BookingBlocker[] = await res.json()
        setBlockers(newBlockers)
      }

      setPendingAdd(new Set())
      setPendingRemoveIds(new Set())
      showToast('success', 'Disponibilités enregistrées ✓')
    } finally {
      setIsSaving(false)
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
      <Toast toast={toast} />
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-5 md:px-0 py-6 md:py-10 md:flex md:gap-14">

        <div className="flex-1 min-w-0">

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
              className="text-texte text-[18px] leading-relaxed mb-4 italic font-light"
              style={{ fontFamily: 'var(--font-cormorant-var)' }}
            >
              Cliquez sur un jour pour signaler qu&apos;il est{' '}
              <em style={{ color: 'var(--color-accent)' }}>déjà pris</em>
              , vous pouvez revenir dessus à tout moment.
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

      <footer className="sticky bottom-0 bg-creme border-t px-5 py-4 md:px-[72px]" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
        <div className="flex gap-3 max-w-[1200px] mx-auto">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
            className={[
              'shrink-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] border transition-colors duration-200',
              hasChanges && !isSaving
                ? 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                : 'border-bordeaux/15 text-bordeaux/30',
            ].join(' ')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              hasChanges && !isSaving ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </footer>
    </>
  )
}
