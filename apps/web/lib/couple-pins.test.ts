import { describe, expect, it } from 'vitest'
import { formatPinnedAt, pinToPublicImage, pinnedCountLabel, removePin, type CouplePin } from './couple-pins'

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

describe('removePin', () => {
  const pin = (portfolioImageId: string): CouplePin => ({
    id: `pin-${portfolioImageId}`,
    portfolioImageId,
    photoUrl: `https://cdn.example/${portfolioImageId}.jpg`,
    pinnedAt: '2026-08-12T09:00:00+00:00',
    vendorId: 'vendor-1',
    tagsByGroup: { Ambiance: ['Intimiste'] },
  })

  it('drops the photo that was unpinned and keeps the others in order', () => {
    const pins = [pin('a'), pin('b'), pin('c')]

    expect(removePin(pins, 'b').map((item) => item.portfolioImageId)).toEqual(['a', 'c'])
  })

  it('matches on the photo id, not on the pin id', () => {
    const pins = [pin('a')]

    // `pin-a` est l'id de l'épinglé : le confondre avec celui de la photo
    // retirerait la mauvaise vignette, ou aucune.
    expect(removePin(pins, 'pin-a')).toHaveLength(1)
  })

  it('leaves the list untouched for an unknown photo', () => {
    const pins = [pin('a'), pin('b')]

    expect(removePin(pins, 'inconnue')).toHaveLength(2)
  })

  it('never mutates the list it was given', () => {
    const pins = [pin('a'), pin('b')]

    removePin(pins, 'a')

    expect(pins).toHaveLength(2)
  })
})

describe('pinToPublicImage', () => {
  it('maps a couple pin to the public portfolio image shape', () => {
    const source: CouplePin = {
      id: 'pin-1',
      portfolioImageId: 'img-1',
      photoUrl: 'https://cdn.example/photo.jpg',
      pinnedAt: '2026-08-12T09:00:00+00:00',
      vendorId: 'vendor-abc',
      tagsByGroup: { Style: ['Bohème'] },
    }

    expect(pinToPublicImage(source)).toEqual({
      id: 'img-1',
      url: 'https://cdn.example/photo.jpg',
      vendorId: 'vendor-abc',
      tagsByGroup: { Style: ['Bohème'] },
    })
  })
})
