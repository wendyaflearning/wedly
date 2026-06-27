'use client'

interface MonthGridProps {
  year: number
  month: number
  confirmedDates: Set<string>
  pendingAddDates: Set<string>
  todayStr: string
  maxDateStr: string
  blockedInMonth: number
  onDayClick: (dateStr: string) => void
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getWeekdayIndex(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

type DayState = 'past' | 'confirmed' | 'pendingAdd' | 'free'

export default function MonthGrid({
  year,
  month,
  confirmedDates,
  pendingAddDates,
  todayStr,
  maxDateStr,
  blockedInMonth,
  onDayClick,
}: MonthGridProps) {
  const firstWeekday = getWeekdayIndex(new Date(year, month, 1))
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: (string | null)[][] = []
  let currentWeek: (string | null)[] = Array(firstWeekday).fill(null)

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(toDateStr(year, month, day))
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  function getDayState(dateStr: string): DayState {
    if (dateStr < todayStr || dateStr > maxDateStr) return 'past'
    if (pendingAddDates.has(dateStr)) return 'pendingAdd'
    if (confirmedDates.has(dateStr)) return 'confirmed'
    return 'free'
  }

  const statusLabel =
    blockedInMonth === 0
      ? 'tout libre'
      : `${blockedInMonth} pris`

  return (
    <div className="flex-1 bg-white rounded-2xl p-4 md:p-6 border border-bordeaux/[0.08] shadow-sm">
      {/* Month header */}
      <div className="flex items-baseline justify-between mb-4 md:mb-5">
        <h2
          className="text-xl md:text-2xl text-texte italic font-light"
          style={{ fontFamily: 'var(--font-cormorant-var)' }}
        >
          {MONTH_NAMES[month]}
          <span
            className="ml-2 not-italic text-gris text-sm md:text-base"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            {year}
          </span>
        </h2>
        <span
          className={`text-xs md:text-sm italic ${blockedInMonth === 0 ? 'text-gris' : 'text-accent'}`}
          style={{ fontFamily: 'var(--font-cormorant-var)' }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1 border-b border-bordeaux/[0.06] pb-1">
        {DAY_LABELS.map((label, i) => {
          const isWeekend = i >= 5
          return (
            <div
              key={i}
              className={`text-center text-[10px] py-1 uppercase tracking-wider ${
                isWeekend ? 'text-accent font-semibold' : 'text-gris'
              }`}
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Weeks */}
      <div className="divide-y divide-bordeaux/[0.05]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 py-0.5">
            {week.map((dateStr, di) => {
              if (!dateStr) return <div key={di} />

              const day = parseInt(dateStr.slice(8), 10)
              const state = getDayState(dateStr)
              const isInteractive = state !== 'past'
              const isWeekend = di >= 5

              let cellClass =
                'w-8 h-8 md:w-9 md:h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-all '

              if (state === 'confirmed') {
                cellClass += 'bg-bordeaux text-creme'
              } else if (state === 'pendingAdd') {
                cellClass += 'bg-bordeaux/60 text-creme'
              } else if (state === 'past') {
                cellClass += 'text-gris/30 cursor-default'
              } else if (isWeekend) {
                cellClass += 'text-texte font-semibold hover:bg-bordeaux/10 cursor-pointer'
              } else {
                cellClass += 'text-gris hover:bg-bordeaux/10 cursor-pointer'
              }

              return (
                <div key={di} className="flex items-center justify-center py-0.5">
                  {isInteractive ? (
                    <button
                      type="button"
                      onClick={() => onDayClick(dateStr)}
                      className={cellClass}
                      style={{ fontFamily: 'var(--font-manrope-var)' }}
                    >
                      {day}
                    </button>
                  ) : (
                    <span
                      className={cellClass}
                      style={{ fontFamily: 'var(--font-manrope-var)' }}
                    >
                      {day}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
