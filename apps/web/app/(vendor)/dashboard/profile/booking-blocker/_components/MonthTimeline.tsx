'use client'

interface TimelineMonth {
  year: number
  month: number
}

interface MonthTimelineProps {
  months: TimelineMonth[]
  activeIndex: number
  onSelect: (index: number) => void
}

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function MonthTimeline({ months, activeIndex, onSelect }: MonthTimelineProps) {
  return (
    <>
      {/* ── Mobile : labels + dots ─────────────────────────────────────── */}
      <div
        className="md:hidden flex gap-5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {months.map(({ month }, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <span
                className={`text-[11px] uppercase tracking-widest ${isActive ? 'text-texte font-semibold' : 'text-gris'}`}
                style={{ fontFamily: 'var(--font-manrope-var)' }}
              >
                {MONTH_SHORT[month]}
              </span>
              <span
                className={`w-[7px] h-[7px] rounded-full transition-colors ${isActive ? 'bg-bordeaux' : 'border border-bordeaux/30'}`}
              />
            </button>
          )
        })}
      </div>

      {/* ── Desktop : pills ────────────────────────────────────────────── */}
      <div
        className="hidden md:flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {months.map(({ year, month }, i) => {
          const isActive = i === activeIndex
          const yearSuffix = `'${String(year).slice(2)}`

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-bordeaux text-creme'
                  : 'text-gris border border-bordeaux/20 hover:border-bordeaux/50 hover:text-texte'
              }`}
              style={{ fontFamily: 'var(--font-manrope-var)' }}
            >
              {MONTH_SHORT[month]}
              <span className={`text-[9px] ${isActive ? 'text-creme/60' : 'text-gris/60'}`}>
                {yearSuffix}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
