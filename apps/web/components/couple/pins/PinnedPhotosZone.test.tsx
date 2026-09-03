import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CoupleCtaStatuses } from '@/lib/couple-cta-status'
import type { CouplePin } from '@/lib/couple-pins'
import { PinnedPhotosZone } from './PinnedPhotosZone'

const emptyCtaStatuses = (): CoupleCtaStatuses => ({ pins: {}, contacts: {} })

const render = (pins: CouplePin[]): string =>
  renderToStaticMarkup(
    <PinnedPhotosZone pins={pins} initialCtaStatuses={emptyCtaStatuses()} />
  )

const pin = (over: Partial<CouplePin> = {}): CouplePin => {
  const id = over.id ?? 'pin-1'

  return {
    id,
    portfolioImageId: `img-${id}`,
    photoUrl: 'https://cdn.example/photo-1.jpg',
    pinnedAt: '2026-08-12T09:00:00+00:00',
    vendorId: 'vendor-1',
    tagsByGroup: {},
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

  it('expose deux gestes par vignette : ouvrir la photo et dé-épingler', () => {
    const html = render([pin({ id: 'a' }), pin({ id: 'b' })])

    expect(html).not.toContain('<a ')

    // Un bouton ouvrir + un bouton cœur par vignette.
    expect(html.match(/<button/g)).toHaveLength(4)
    expect(html.match(/aria-label="Ouvrir la photo épinglée"/g)).toHaveLength(2)
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
