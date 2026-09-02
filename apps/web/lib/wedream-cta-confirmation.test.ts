import { describe, expect, it } from 'vitest'
import { ctaConfirmation, type CtaConfirmationStatus } from './wedream-cta-confirmation'

describe('ctaConfirmation', () => {
  it('laisse les deux boutons dans leur libellé d’origine tant que rien n’a été cliqué', () => {
    expect(ctaConfirmation('pin', 'idle')).toEqual({
      label: 'Épingler',
      confirmed: false,
      showsCoupleSpaceLink: false,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
    expect(ctaConfirmation('contact', 'idle')).toEqual({
      label: 'Je veux être mis en relation',
      confirmed: false,
      showsCoupleSpaceLink: false,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
  })

  it('confirme l’épingle du couple connecté et lui ouvre son espace perso', () => {
    expect(ctaConfirmation('pin', 'done')).toEqual({
      label: 'Épinglé',
      confirmed: true,
      showsCoupleSpaceLink: true,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
  })

  it('confirme l’épingle à l’identique sans compte, mais sans lien vers un espace qui n’existe pas', () => {
    expect(ctaConfirmation('pin', 'auth_required')).toEqual({
      label: 'Épinglé',
      confirmed: true,
      showsCoupleSpaceLink: false,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
  })

  it('annonce la demande envoyée au couple connecté', () => {
    expect(ctaConfirmation('contact', 'done')).toEqual({
      label: 'Demande envoyée',
      confirmed: true,
      showsCoupleSpaceLink: true,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
  })

  it('met la demande en attente sans compte : rien n’est parti chez le prestataire', () => {
    expect(ctaConfirmation('contact', 'auth_required')).toEqual({
      label: 'Demande en attente',
      confirmed: true,
      showsCoupleSpaceLink: false,
      disabled: false,
      showsDiscoveryPrompt: false,
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

  it('dit au couple que sa demande attend toujours une réponse du prestataire', () => {
    expect(ctaConfirmation('contact', 'done', 'EN_ATTENTE')).toEqual({
      label: 'Demande envoyée — en attente',
      confirmed: false,
      showsCoupleSpaceLink: false,
      disabled: true,
      showsDiscoveryPrompt: false,
    })
  })

  it('renvoie vers l’espace perso quand le prestataire a accepté', () => {
    expect(ctaConfirmation('contact', 'done', 'DEBLOQUEE')).toEqual({
      label: 'Vous êtes déjà en contact',
      confirmed: true,
      showsCoupleSpaceLink: true,
      disabled: false,
      showsDiscoveryPrompt: false,
    })
  })

  it('éteint le bouton sur un refus et propose d’aller voir ailleurs, sans retry', () => {
    expect(ctaConfirmation('contact', 'done', 'REFUSEE')).toEqual({
      label: 'Demande non retenue',
      confirmed: false,
      showsCoupleSpaceLink: false,
      disabled: true,
      showsDiscoveryPrompt: true,
    })
  })

  it('ne laisse actif que le statut qui mène quelque part', () => {
    const leadStatuses = ['EN_ATTENTE', 'DEBLOQUEE', 'REFUSEE'] as const

    for (const leadStatus of leadStatuses) {
      const cta = ctaConfirmation('contact', 'done', leadStatus)
      expect(cta.disabled).toBe(leadStatus !== 'DEBLOQUEE')
      // Un bouton éteint ne doit jamais être peint comme une confirmation :
      // les deux drapeaux pilotent des fonds opposés, ils ne peuvent pas être
      // vrais ensemble.
      expect(cta.confirmed && cta.disabled).toBe(false)
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
