import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CouplePin } from '@/lib/couple-pins'
import { PinnedPhotosZone } from './PinnedPhotosZone'

/**
 * La zone porte désormais un état (la liste rétrécit quand on dé-épingle), mais
 * son rendu initial reste celui de ses props : `renderToStaticMarkup` suffit à
 * vérifier ce que le CA demande, sans DOM à monter. Le cycle clic →
 * confirmation → retrait, lui, n'est pas couvert ici — le repo n'a pas de
 * moteur d'interaction React.
 */
const render = (pins: CouplePin[]): string =>
  renderToStaticMarkup(<PinnedPhotosZone pins={pins} />)

const pin = (over: Partial<CouplePin> = {}): CouplePin => {
  const id = over.id ?? 'pin-1'

  return {
    id,
    portfolioImageId: `img-${id}`,
    photoUrl: 'https://cdn.example/photo-1.jpg',
    pinnedAt: '2026-08-12T09:00:00+00:00',
    ...over,
  }
}

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

  it('n’expose qu’un seul geste par vignette : retirer son propre épinglé', () => {
    const html = render([pin({ id: 'a' }), pin({ id: 'b' })])

    // Aucun lien : rien dans la grille ne mène ailleurs, et surtout pas vers une
    // fiche prestataire (CA « aucun clic ne dévoile un profil prestataire »).
    // Le `<link rel="preload">` que React 19 émet pour l'`<img>` n'est pas un
    // geste, d'où la cible sur `<a ` et non sur `link`.
    expect(html).not.toContain('<a ')

    // Un bouton par vignette, et un seul : le cœur de dé-épinglage.
    expect(html.match(/<button/g)).toHaveLength(2)
    expect(html.match(/aria-label="Dé-épingler cette photo"/g)).toHaveLength(2)
  })

  it('ne demande confirmation qu’après un clic, jamais au chargement', () => {
    const html = render([pin()])

    expect(html).not.toContain('Retirer ce coup de cœur ?')
  })

  it('garde la vignette même quand la date est illisible, sans légende', () => {
    const html = render([pin({ pinnedAt: 'pas-une-date' })])

    expect(html).toContain('<figure')
    expect(html).not.toContain('<figcaption')
  })
})
