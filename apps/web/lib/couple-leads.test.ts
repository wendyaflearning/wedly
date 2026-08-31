import { describe, expect, it } from 'vitest'
import {
  countByStatus,
  formatFromPrice,
  formatRequestedAt,
  fullPriceRange,
  formatLeadDate,
  isUnlockedLead,
  leadNoticeMessage,
  leadTooltipLines,
  portfolioLinkLabel,
  priceAmountRange,
  unlockedProgressLabel,
  STATUS_FILTER_ORDER,
  STATUS_LABELS,
  vendorTypeLabel,
  type CoupleLead,
  type MaskedLead,
  type UnlockedLead,
  type UnlockedVendor,
} from './couple-leads'

/** `Intl` fr-FR inserts narrow / non-breaking spaces around numbers; collapse them for stable assertions. */
const norm = (value: string): string => value.replace(/\s/g, ' ')
const normAll = (values: string[]): string[] => values.map(norm)

const maskedLead = (over: Partial<MaskedLead> = {}): MaskedLead => ({
  id: 'lead-1',
  status: 'EN_ATTENTE',
  requestedAt: '2026-08-12T09:00:00+00:00',
  category: 'Photographe',
  zones: ['Île-de-France'],
  photoUrl: 'https://cdn.wedly.test/p.jpg',
  ...over,
})

const vendor = (over: Partial<UnlockedVendor> = {}): UnlockedVendor => ({
  id: 'vendor-1',
  brandName: 'Maison Verger',
  bio: null,
  description: null,
  vendorType: 'traiteur',
  services: [],
  styles: [],
  priceType: 'per_person',
  priceMinCents: 4500,
  priceMaxCents: null,
  portfolio: [],
  contact: { email: 'hello@verger.test', phone: '0600000000', address: null, zipcode: null, city: null },
  ...over,
})

const unlockedLead = (over: Partial<UnlockedLead> = {}): UnlockedLead => {
  const { id, requestedAt, category, zones, photoUrl } = maskedLead()
  return { id, requestedAt, category, zones, photoUrl, status: 'DEBLOQUEE', vendor: vendor(), ...over }
}

describe('isUnlockedLead', () => {
  it('discriminates on status only', () => {
    expect(isUnlockedLead(maskedLead())).toBe(false)
    expect(isUnlockedLead(maskedLead({ status: 'REFUSEE' }))).toBe(false)
    expect(isUnlockedLead(unlockedLead())).toBe(true)
  })
})

describe('STATUS labels & filters', () => {
  it('labels the three couple-facing statuses in French', () => {
    expect(STATUS_LABELS).toEqual({
      EN_ATTENTE: 'En attente',
      REFUSEE: 'Refusée',
      DEBLOQUEE: 'Débloquée',
    })
  })

  it('orders the status filters En attente → Débloquée → Refusée', () => {
    expect(STATUS_FILTER_ORDER).toEqual(['EN_ATTENTE', 'DEBLOQUEE', 'REFUSEE'])
  })
})

describe('formatRequestedAt', () => {
  it('formats an ISO date as "Demandé le <jour> <mois>"', () => {
    expect(formatRequestedAt('2026-08-12T09:00:00+00:00')).toBe('Demandé le 12 août')
  })

  it('returns null on an unparseable date', () => {
    expect(formatRequestedAt('not-a-date')).toBeNull()
  })
})

describe('formatFromPrice', () => {
  it('formats cents as "À partir de <montant> €"', () => {
    expect(norm(formatFromPrice(120000)!)).toBe('À partir de 1 200 €')
  })

  it('returns null when there is no positive floor price', () => {
    expect(formatFromPrice(0)).toBeNull()
    expect(formatFromPrice(null)).toBeNull()
    expect(formatFromPrice(undefined)).toBeNull()
  })
})

describe('fullPriceRange', () => {
  it('renders a range with the price-type suffix when a max is set', () => {
    expect(norm(fullPriceRange(vendor({ priceMinCents: 4500, priceMaxCents: 9000, priceType: 'per_person' }))!)).toBe(
      '45 € – 90 € par personne',
    )
  })

  it('falls back to "À partir de" when there is no meaningful max', () => {
    expect(norm(fullPriceRange(vendor({ priceMinCents: 4500, priceMaxCents: null, priceType: 'per_person' }))!)).toBe(
      'À partir de 45 € par personne',
    )
  })

  it('returns null without a floor price', () => {
    expect(fullPriceRange(vendor({ priceMinCents: null }))).toBeNull()
  })
})

describe('leadTooltipLines', () => {
  it('summarises name, role, contact (phone first) and floor price', () => {
    expect(normAll(leadTooltipLines(unlockedLead()))).toEqual([
      'Maison Verger',
      'Photographe',
      '0600000000',
      'À partir de 45 €',
    ])
  })

  it('falls back to the vendor type when the category is missing, and to e-mail without a phone', () => {
    const lead = unlockedLead({
      category: null,
      vendor: vendor({ contact: { email: 'hello@verger.test', phone: null, address: null, zipcode: null, city: null } }),
    })
    expect(normAll(leadTooltipLines(lead))).toEqual([
      'Maison Verger',
      vendorTypeLabel('traiteur'),
      'hello@verger.test',
      'À partir de 45 €',
    ])
  })

  it('omits price when none is exposed', () => {
    const lead = unlockedLead({ vendor: vendor({ priceMinCents: null }) })
    expect(normAll(leadTooltipLines(lead))).toEqual(['Maison Verger', 'Photographe', '0600000000'])
  })
})

describe('countByStatus', () => {
  it('counts each status plus the total', () => {
    const items: CoupleLead[] = [
      maskedLead({ id: 'a', status: 'EN_ATTENTE' }),
      maskedLead({ id: 'b', status: 'EN_ATTENTE' }),
      maskedLead({ id: 'c', status: 'REFUSEE' }),
      unlockedLead({ id: 'd' }),
    ]
    expect(countByStatus(items)).toEqual({ ALL: 4, EN_ATTENTE: 2, DEBLOQUEE: 1, REFUSEE: 1 })
  })

  it('is all-zero for an empty list', () => {
    expect(countByStatus([])).toEqual({ ALL: 0, EN_ATTENTE: 0, DEBLOQUEE: 0, REFUSEE: 0 })
  })
})

describe('leadNoticeMessage', () => {
  it('explains each reason the unlocked sheet sent the couple back', () => {
    expect(leadNoticeMessage('introuvable')).toBe("Cette demande n'existe plus.")
    expect(leadNoticeMessage('verrouillee')).toContain('pas encore débloquée')
  })

  it('stays silent on an absent or unknown code', () => {
    expect(leadNoticeMessage(undefined)).toBeNull()
    expect(leadNoticeMessage('')).toBeNull()
    expect(leadNoticeMessage('nimporte-quoi')).toBeNull()
  })
})

describe('formatLeadDate', () => {
  it('renders the bare day, without the « Demandé le » prefix', () => {
    expect(formatLeadDate('2026-08-12T09:30:00+00:00')).toBe('12 août')
  })

  it('returns null on an unreadable date', () => {
    expect(formatLeadDate('pas-une-date')).toBeNull()
  })
})

describe('priceAmountRange', () => {
  it('gives the amount alone, without the price type', () => {
    expect(norm(priceAmountRange(vendor({ priceMinCents: 220000, priceMaxCents: 420000 }))!)).toBe(
      '2 200 € – 4 200 €',
    )
  })

  it('falls back to a floor price when no upper bound stands above it', () => {
    expect(norm(priceAmountRange(vendor({ priceMinCents: 220000, priceMaxCents: null }))!)).toBe(
      'À partir de 2 200 €',
    )
  })

  it('returns null without a floor price', () => {
    expect(priceAmountRange(vendor({ priceMinCents: null, priceMaxCents: null }))).toBeNull()
  })
})

describe('portfolioLinkLabel', () => {
  it('agrees in number', () => {
    expect(portfolioLinkLabel(24)).toBe('Voir les 24 photos')
    expect(portfolioLinkLabel(1)).toBe('Voir la photo')
  })

  it('stays silent on an empty portfolio', () => {
    expect(portfolioLinkLabel(0)).toBeNull()
    expect(portfolioLinkLabel(-3)).toBeNull()
  })
})

describe('unlockedProgressLabel', () => {
  it('counts the unlocked requests against the whole list', () => {
    expect(unlockedProgressLabel({ ALL: 4, EN_ATTENTE: 1, DEBLOQUEE: 2, REFUSEE: 1 })).toBe(
      '2 sur 4 débloqués',
    )
  })

  it('agrees in number on a single unlocked request', () => {
    expect(unlockedProgressLabel({ ALL: 3, EN_ATTENTE: 1, DEBLOQUEE: 1, REFUSEE: 1 })).toBe(
      '1 sur 3 débloqué',
    )
    expect(unlockedProgressLabel({ ALL: 2, EN_ATTENTE: 2, DEBLOQUEE: 0, REFUSEE: 0 })).toBe(
      '0 sur 2 débloqué',
    )
  })

  it('returns null when the couple has no request at all', () => {
    expect(unlockedProgressLabel({ ALL: 0, EN_ATTENTE: 0, DEBLOQUEE: 0, REFUSEE: 0 })).toBeNull()
  })
})
