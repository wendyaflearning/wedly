import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COPILOT_TEASERS } from '@/lib/couple-accompagnement'
import { AccompagnementZone } from './AccompagnementZone'

const html = () => renderToStaticMarkup(<AccompagnementZone />)

describe('AccompagnementZone', () => {
  it('affiche les 3 teasers du copilote avec nom et description', () => {
    const markup = html()

    for (const teaser of COPILOT_TEASERS) {
      expect(markup).toContain(teaser.name)
      expect(markup).toContain(teaser.description)
    }
    expect(COPILOT_TEASERS.map((t) => t.name)).toEqual(['WedPlan', 'WedWallet', 'WedMatch'])
  })

  it('porte les deux badges attendus : « Bientôt disponible » et « Formule payante »', () => {
    const markup = html()

    expect(markup).toContain('Bientôt disponible')
    expect(markup).toContain('Formule payante')
  })

  it('signale chaque module comme réservé à la formule payante', () => {
    const markup = html()

    expect(markup.match(/aria-label="Réservé à la formule payante"/g)).toHaveLength(
      COPILOT_TEASERS.length,
    )
  })

  it('utilise le vouvoiement dans le titre de la zone', () => {
    const markup = html()

    expect(markup).toContain('Votre accompagnement')
    expect(markup).not.toContain('Ton accompagnement')
  })

  it('ne contient aucun CTA actif (ni lien, ni bouton de paiement)', () => {
    const markup = html()

    expect(markup).not.toContain('<a ')
    expect(markup).not.toContain('<button')
    expect(markup.toLowerCase()).not.toContain('99')
    expect(markup.toLowerCase()).not.toContain('payer')
  })
})
