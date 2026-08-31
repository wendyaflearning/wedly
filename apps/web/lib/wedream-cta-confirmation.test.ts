import { describe, expect, it } from 'vitest'
import { ctaConfirmation, type CtaConfirmationStatus } from './wedream-cta-confirmation'

describe('ctaConfirmation', () => {
  it('laisse les deux boutons dans leur libellé d’origine tant que rien n’a été cliqué', () => {
    expect(ctaConfirmation('pin', 'idle')).toEqual({
      label: 'Épingler',
      confirmed: false,
      showsCoupleSpaceLink: false,
    })
    expect(ctaConfirmation('contact', 'idle')).toEqual({
      label: 'Je veux être mis en relation',
      confirmed: false,
      showsCoupleSpaceLink: false,
    })
  })

  it('confirme l’épingle du couple connecté et lui ouvre son espace perso', () => {
    expect(ctaConfirmation('pin', 'done')).toEqual({
      label: 'Épinglé',
      confirmed: true,
      showsCoupleSpaceLink: true,
    })
  })

  it('confirme l’épingle à l’identique sans compte, mais sans lien vers un espace qui n’existe pas', () => {
    expect(ctaConfirmation('pin', 'auth_required')).toEqual({
      label: 'Épinglé',
      confirmed: true,
      showsCoupleSpaceLink: false,
    })
  })

  it('annonce la demande envoyée au couple connecté', () => {
    expect(ctaConfirmation('contact', 'done')).toEqual({
      label: 'Demande envoyée',
      confirmed: true,
      showsCoupleSpaceLink: true,
    })
  })

  it('met la demande en attente sans compte : rien n’est parti chez le prestataire', () => {
    expect(ctaConfirmation('contact', 'auth_required')).toEqual({
      label: 'Demande en attente',
      confirmed: true,
      showsCoupleSpaceLink: false,
    })
  })

  it('ne promet jamais un envoi à un couple sans compte', () => {
    const labels = (['pin', 'contact'] as const).map(
      (kind) => ctaConfirmation(kind, 'auth_required').label
    )

    for (const label of labels) {
      expect(label.toLowerCase()).not.toContain('envoy')
    }
  })

  it('ne montre le lien espace perso que sur une écriture réellement passée', () => {
    const statuses: CtaConfirmationStatus[] = ['idle', 'done', 'auth_required']

    for (const kind of ['pin', 'contact'] as const) {
      for (const status of statuses) {
        expect(ctaConfirmation(kind, status).showsCoupleSpaceLink).toBe(status === 'done')
      }
    }
  })
})
