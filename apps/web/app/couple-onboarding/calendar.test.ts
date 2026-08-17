import { describe, expect, it } from 'vitest'
import { canGoToPreviousMonth, isSelectableWeddingDate, startOfDay } from './calendar'

describe('couple onboarding calendar', () => {
  const today = new Date(2026, 7, 17, 14, 30)

  it('accepts today even when the current time is past midnight', () => {
    expect(isSelectableWeddingDate(new Date(2026, 7, 17, 0, 0), today)).toBe(true)
  })

  it('accepts any future wedding date', () => {
    expect(isSelectableWeddingDate(new Date(2027, 5, 12), today)).toBe(true)
  })

  it('rejects yesterday and any earlier date', () => {
    expect(isSelectableWeddingDate(new Date(2026, 7, 16), today)).toBe(false)
    expect(isSelectableWeddingDate(new Date(2024, 5, 1), today)).toBe(false)
  })

  it('blocks navigation below the current month', () => {
    expect(canGoToPreviousMonth(new Date(2026, 7, 1), today)).toBe(false)
    expect(canGoToPreviousMonth(new Date(2026, 8, 1), today)).toBe(true)
  })

  it('strips the time component so comparisons stay day-based', () => {
    expect(startOfDay(today)).toEqual(new Date(2026, 7, 17))
  })
})
