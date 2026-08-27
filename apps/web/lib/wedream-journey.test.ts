import { describe, it, expect } from 'vitest'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import {
  FALLBACK_TRADE_ICON,
  humanizeServiceSlug,
  isCloudinaryUrl,
  pickWedreamPhotos,
  resolvePrimaryTagLabel,
  resolveVendorTrade,
} from './wedream-journey'

function photo(overrides: Partial<PortfolioImage> & { id: string }): PortfolioImage {
  return {
    url: `https://res.cloudinary.com/demo/image/upload/${overrides.id}.jpg`,
    is_cover: false,
    sort_order: 0,
    is_visible_in_wedream: true,
    tags: [],
    ...overrides,
  }
}

describe('resolveVendorTrade', () => {
  it('retient le premier service reconnu du prestataire', () => {
    const trade = resolveVendorTrade(['photographe'])
    expect(trade?.label).toBe('Photographe')
    expect(trade?.icon).not.toBe(FALLBACK_TRADE_ICON)
  })

  it('ignore un service inconnu placé devant un service reconnu', () => {
    expect(resolveVendorTrade(['magicien', 'fleuriste'])?.label).toBe('Fleuriste')
  })

  it('mappe les 11 services racines sur des icônes distinctes', () => {
    const slugs = [
      'photographe', 'traiteur', 'fleuriste', 'dj', 'videaste', 'decoration',
      'maquillage', 'coiffure', 'coordinatrice-mariage', 'lieu-de-reception',
      'tailleur-homme',
    ]
    const icons = slugs.map((slug) => resolveVendorTrade([slug])?.icon)

    expect(icons.every((icon) => icon && icon !== FALLBACK_TRADE_ICON)).toBe(true)
    expect(new Set(icons).size).toBe(slugs.length)
  })

  it('retombe sur l’icône de repli et le slug humanisé pour un métier non mappé', () => {
    const trade = resolveVendorTrade(['costumier-tailleur-sur-mesure'])
    expect(trade).toEqual({
      label: 'Costumier tailleur sur mesure',
      icon: FALLBACK_TRADE_ICON,
    })
  })

  it('renvoie null quand le prestataire n’a aucun service', () => {
    expect(resolveVendorTrade([])).toBeNull()
  })
})

describe('humanizeServiceSlug', () => {
  it('remplace les tirets et capitalise', () => {
    expect(humanizeServiceSlug('bar-a-cocktail')).toBe('Bar a cocktail')
  })
})

describe('resolvePrimaryTagLabel', () => {
  it('retient le libellé le plus fréquent, pas le premier rencontré', () => {
    const photos = [
      photo({ id: '1', tags: [{ id: 't-ext', label: 'Extérieur' }, { id: 't-boh', label: 'Bohème' }] }),
      photo({ id: '2', tags: [{ id: 't-boh', label: 'Bohème' }] }),
      photo({ id: '3', tags: [{ id: 't-boh', label: 'Bohème' }, { id: 't-int', label: 'Intérieur' }] }),
    ]

    expect(resolvePrimaryTagLabel(photos)).toBe('Bohème')
  })

  it('départage une égalité par le premier tag rencontré', () => {
    const photos = [
      photo({ id: '1', tags: [{ id: 't-chic', label: 'Chic' }] }),
      photo({ id: '2', tags: [{ id: 't-boh', label: 'Bohème' }] }),
    ]

    expect(resolvePrimaryTagLabel(photos)).toBe('Chic')
  })

  it('renvoie null quand aucune photo n’est taguée', () => {
    expect(resolvePrimaryTagLabel([photo({ id: '1' })])).toBeNull()
    expect(resolvePrimaryTagLabel([])).toBeNull()
  })
})

describe('pickWedreamPhotos', () => {
  it('écarte les photos non visibles dans WedDream', () => {
    const photos = [
      photo({ id: 'cachee', is_visible_in_wedream: false }),
      photo({ id: 'visible' }),
    ]

    expect(pickWedreamPhotos(photos, 4).map((p) => p.id)).toEqual(['visible'])
  })

  it('place la couverture en premier puis trie par sort_order', () => {
    const photos = [
      photo({ id: 'c', sort_order: 3 }),
      photo({ id: 'a', sort_order: 1 }),
      photo({ id: 'cover', sort_order: 9, is_cover: true }),
      photo({ id: 'b', sort_order: 2 }),
    ]

    expect(pickWedreamPhotos(photos, 4).map((p) => p.id)).toEqual(['cover', 'a', 'b', 'c'])
  })

  it('écarte une URL hors Cloudinary que next/image refuserait', () => {
    const photos = [
      photo({ id: 'externe', url: 'https://example.com/photo.jpg' }),
      photo({ id: 'cloudinary' }),
    ]

    expect(pickWedreamPhotos(photos, 4).map((p) => p.id)).toEqual(['cloudinary'])
  })

  it('ne dépasse jamais le nombre de cases demandé', () => {
    const photos = Array.from({ length: 10 }, (_, i) => photo({ id: `p${i}`, sort_order: i }))

    expect(pickWedreamPhotos(photos, 4)).toHaveLength(4)
  })

  it('ne mute pas le tableau reçu', () => {
    const photos = [photo({ id: 'b', sort_order: 2 }), photo({ id: 'a', sort_order: 1 })]

    pickWedreamPhotos(photos, 4)

    expect(photos.map((p) => p.id)).toEqual(['b', 'a'])
  })
})

describe('isCloudinaryUrl', () => {
  it('refuse une URL malformée sans lever', () => {
    expect(isCloudinaryUrl('pas-une-url')).toBe(false)
  })
})
