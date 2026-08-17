export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * A wedding date can only be today or later, so past days stay visible but
 * unselectable rather than disappearing from the grid.
 */
export function isSelectableWeddingDate(date: Date, today: Date): boolean {
  return startOfDay(date).getTime() >= startOfDay(today).getTime()
}

export function hasSelectableDayInMonth(visibleMonth: Date, today: Date): boolean {
  const lastDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)

  return isSelectableWeddingDate(lastDayOfMonth, today)
}

/** The couple can never navigate to a month whose every day is already past. */
export function canGoToPreviousMonth(visibleMonth: Date, today: Date): boolean {
  return startOfMonth(visibleMonth).getTime() > startOfMonth(today).getTime()
}
