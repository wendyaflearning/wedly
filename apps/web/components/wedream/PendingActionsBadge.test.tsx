import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COUPLE_ONBOARDING_PATH } from './AccountCreationModal'
import { PendingActionsBadgeView } from './PendingActionsBadge'

/**
 * La vue se teste sans navigateur : elle ne lit rien, on lui passe deux chiffres.
 * Le rendu statique suffit à vérifier ce que le CA demande — présence, libellés,
 * destination du CTA — sans monter de DOM.
 */
function render(pinCount: number, contactCount: number): string {
  return renderToStaticMarkup(
    <PendingActionsBadgeView pinCount={pinCount} contactCount={contactCount} />,
  )
}

/** Ce que le badge dit, sans le balisage : les chiffres des icônes SVG n'en sont pas. */
function renderedText(pinCount: number, contactCount: number): string {
  return render(pinCount, contactCount).replace(/<[^>]*>/g, '')
}

describe('badge des gestes en attente', () => {
  it('n’affiche rien tant que rien n’est en attente', () => {
    expect(render(0, 0)).toBe('')
  })

  it('apparaît dès un seul geste, quel qu’il soit', () => {
    expect(render(1, 0)).not.toBe('')
    expect(render(0, 1)).not.toBe('')
  })

  it('affiche deux compteurs distincts, jamais un total fusionné', () => {
    const text = renderedText(2, 1)

    expect(text).toContain('2 coups de cœur')
    expect(text).toContain('1 demande en attente')
    // 2 + 1 = 3 ne doit apparaître nulle part : le couple a épinglé deux photos
    // et demandé un contact, il n'a pas « fait 3 choses ».
    expect(text).not.toContain('3')
  })

  it('accorde les libellés au singulier comme au pluriel', () => {
    expect(render(1, 2)).toContain('1 coup de cœur')
    expect(render(1, 2)).toContain('2 demandes en attente')
  })

  it('tait le compteur resté à zéro plutôt que d’afficher « 0 »', () => {
    const html = render(2, 0)

    expect(html).toContain('2 coups de cœur')
    expect(html).not.toContain('demande')
  })

  it('garde le chiffre seul pour le mobile, en plus du libellé complet', () => {
    // L'affichage se compacte, l'information non : le libellé reste dans le DOM
    // pour les lecteurs d'écran, à côté du chiffre nu affiché en petite largeur.
    const html = render(2, 1)

    expect(html).toContain('md:hidden')
    expect(html).toContain('sr-only')
  })

  it('ne parle jamais d’une demande envoyée', () => {
    expect(render(0, 2)).not.toContain('envoy')
  })

  it('envoie le CTA droit sur l’onboarding couple', () => {
    expect(render(1, 0)).toContain(`href="${COUPLE_ONBOARDING_PATH}"`)
    expect(render(1, 0)).toContain('Créer mon compte')
  })
})
