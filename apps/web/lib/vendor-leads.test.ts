import { describe, expect, it } from 'vitest'
import type { VendorProviderLead } from './vendor'
import { isUnlockedVendorLead, leadStatusLabel } from './vendor-leads'

const base = {
  id: 'lead-1',
  firstName: 'Camille',
  weddingDate: '2027-06-12',
  guestCount: 120,
  weddingBudgetCents: 2_350_000,
  category: 'Photographe',
  specialtyTags: ['Bohème'],
  requestedAt: '2026-08-28T09:00:00+00:00',
  photoUrl: null,
}

describe('isUnlockedVendorLead', () => {
  it('ne débloque pas une demande dont la réponse ne porte aucune coordonnée', () => {
    const lead = { ...base, status: 'pending' } as VendorProviderLead

    expect(isUnlockedVendorLead(lead)).toBe(false)
  })

  /**
   * Le garde suit la forme reçue, pas le statut : `confirmed` et `contacted` sont
   * des acceptations d'avant WED-131, et le backend les débloque aussi. Un `match`
   * sur le statut côté front finirait par diverger de cette liste blanche.
   */
  it('débloque toute forme qui porte les coordonnées, statut historique compris', () => {
    for (const status of ['accepted', 'confirmed', 'contacted'] as const) {
      const lead = {
        ...base,
        status,
        lastName: 'Dupont',
        email: 'camille@example.test',
        phone: null,
      } as VendorProviderLead

      expect(isUnlockedVendorLead(lead)).toBe(true)
    }
  })

  it('ne débloque pas une demande refusée', () => {
    const lead = { ...base, status: 'refused' } as VendorProviderLead

    expect(isUnlockedVendorLead(lead)).toBe(false)
  })
})

describe('leadStatusLabel', () => {
  it('mappe le cycle de vie backend sur les quatre libellés de la maquette', () => {
    expect(leadStatusLabel('pending')).toBe('Nouveau')
    expect(leadStatusLabel('accepted')).toBe('Accepté')
    expect(leadStatusLabel('confirmed')).toBe('Accepté')
    expect(leadStatusLabel('contacted')).toBe('Accepté')
    expect(leadStatusLabel('refused')).toBe('Refusé')
    expect(leadStatusLabel('closed')).toBe('Clos')
    expect(leadStatusLabel('unavailable')).toBe('Clos')
  })
})
