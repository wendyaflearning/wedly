import { describe, expect, it } from 'vitest'
import { formatPinnedAt, pinnedCountLabel } from './couple-pins'

/** `Intl` fr-FR insère des espaces fines/insécables ; on les normalise pour des assertions stables. */
const norm = (value: string): string => value.replace(/\s/g, ' ')

describe('formatPinnedAt', () => {
  it('renders the day and month in French', () => {
    expect(norm(formatPinnedAt('2026-08-12T09:00:00+00:00') ?? '')).toBe('Épinglée le 12 août')
  })

  it('returns null on an unreadable date', () => {
    expect(formatPinnedAt('pas-une-date')).toBeNull()
    expect(formatPinnedAt('')).toBeNull()
  })
})

describe('pinnedCountLabel', () => {
  it('agrees the label in number', () => {
    expect(pinnedCountLabel(1)).toBe('1 photo épinglée')
    expect(pinnedCountLabel(12)).toBe('12 photos épinglées')
  })

  it('returns null when there is nothing to count', () => {
    expect(pinnedCountLabel(0)).toBeNull()
    expect(pinnedCountLabel(-3)).toBeNull()
    expect(pinnedCountLabel(Number.NaN)).toBeNull()
  })
})
