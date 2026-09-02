import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CouplePin } from '@/lib/couple-pins'
import { PinnedPhotosZone } from './PinnedPhotosZone'

/**
 * La zone est un composant serveur sans état : on lui passe des pins et on lit
 * le balisage rendu. Rendu statique, comme `PendingActionsBadge.test.tsx` —
 * pas de DOM à monter pour vérifier ce que le CA demande.
 */
const render = (pins: CouplePin[]): string =>
  renderToStaticMarkup(<PinnedPhotosZone pins={pins} />)

const pin = (over: Partial<CouplePin> = {}): CouplePin => ({
  id: 'pin-1',
  portfolioImageId: 'img-1',
  photoUrl: 'https://cdn.example/photo-1.jpg',
  pinnedAt: '2026-08-12T09:00:00+00:00',
  ...over,
})

describe('PinnedPhotosZone', () => {
  it('montre l’état vide quand aucune photo n’est épinglée', () => {
    const html = render([])

    expect(html).toContain('Aucune photo épinglée pour l’instant')
    expect(html).toContain('gratuit et sans limite de nombre')
    expect(html).not.toContain('<ul')
  })

  it('rend une vignette par photo épinglée, avec sa légende de date', () => {
    const html = render([
      pin({ id: 'a', photoUrl: 'https://cdn.example/a.jpg' }),
      pin({ id: 'b', photoUrl: 'https://cdn.example/b.jpg', pinnedAt: '2026-07-01T10:00:00+00:00' }),
    ])

    expect(html.match(/<figure/g)).toHaveLength(2)
    expect(html).toContain('https://cdn.example/a.jpg')
    expect(html).toContain('https://cdn.example/b.jpg')
    expect(html).toContain('12 août')
    expect(html).toContain('1 juillet')
    expect(html).toContain('2 photos épinglées')
  })

  it('n’expose jamais de geste cliquable : ni lien, ni bouton', () => {
    const html = render([pin(), pin({ id: 'pin-2' })])

    // Le `<link rel="preload">` que React 19 émet pour l'`<img>` n'est pas un
    // geste : on vise les seuls éléments interactifs, `<a>` et `<button>`.
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('<button')
  })

  it('garde la vignette même quand la date est illisible, sans légende', () => {
    const html = render([pin({ pinnedAt: 'pas-une-date' })])

    expect(html).toContain('<figure')
    expect(html).not.toContain('<figcaption')
  })
})
