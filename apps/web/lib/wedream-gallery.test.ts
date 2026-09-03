import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioImagesPage } from './wedream-gallery'

const EMPTY_PAGE: PortfolioImagesPage = { items: [], nextCursor: null, total: 0 }

const PAGE: PortfolioImagesPage = {
  items: [
    {
      id: '0198a1c0-0000-7000-8000-000000000001',
      url: 'https://res.cloudinary.com/demo/image/upload/1.jpg',
      tagsByGroup: { 'Type de lieu': ['Domaine'], Ambiance: ['Intimiste'] },
      vendorId: '0198a1c0-0000-7000-8000-0000000000bb',
    },
  ],
  nextCursor: '0198a1c0-0000-7000-8000-000000000001',
  total: 7,
}

/**
 * fetchTagValuePortfolioImages lit NEXT_PUBLIC_API_URL au chargement du module :
 * on réimporte à chaud pour contrôler l'environnement de chaque cas.
 */
async function loadModule() {
  vi.resetModules()
  return import('./wedream-gallery')
}

function mockFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.test')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('fetchTagValuePortfolioImages', () => {
  it('renvoie la page parsée telle quelle', async () => {
    mockFetch({ ok: true, json: async () => PAGE })
    const { fetchTagValuePortfolioImages } = await loadModule()

    const page = await fetchTagValuePortfolioImages('tag-1')

    expect(page.total).toBe(7)
    expect(page.nextCursor).toBe('0198a1c0-0000-7000-8000-000000000001')
    expect(page.items).toHaveLength(1)
    expect(page.items[0].tagsByGroup['Type de lieu']).toEqual(['Domaine'])
    // Sans lui, deux photos du même prestataire sont deux inconnus (WED-195).
    expect(page.items[0].vendorId).toBe('0198a1c0-0000-7000-8000-0000000000bb')
  })

  it('appelle l’API sans query string quand aucun paramètre n’est fourni', async () => {
    const fetchMock = mockFetch({ ok: true, json: async () => PAGE })
    const { fetchTagValuePortfolioImages } = await loadModule()

    await fetchTagValuePortfolioImages('tag-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/v1/tag-values/tag-1/portfolio-images',
      { cache: 'no-store' }
    )
  })

  it('relaie limit et cursor quand ils sont fournis', async () => {
    const fetchMock = mockFetch({ ok: true, json: async () => PAGE })
    const { fetchTagValuePortfolioImages } = await loadModule()

    await fetchTagValuePortfolioImages('tag-1', { limit: 24, cursor: 'abc' })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.test/api/v1/tag-values/tag-1/portfolio-images?limit=24&cursor=abc'
    )
  })

  it('retombe sur une page vide sans NEXT_PUBLIC_API_URL, sans appeler fetch', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '')
    const fetchMock = mockFetch({ ok: true, json: async () => PAGE })
    const { fetchTagValuePortfolioImages } = await loadModule()

    await expect(fetchTagValuePortfolioImages('tag-1')).resolves.toEqual(EMPTY_PAGE)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retombe sur une page vide quand la réponse est non-ok', async () => {
    mockFetch({ ok: false, status: 404, json: async () => ({ error: 'Sous-style introuvable.' }) })
    const { fetchTagValuePortfolioImages } = await loadModule()

    await expect(fetchTagValuePortfolioImages('tag-1')).resolves.toEqual(EMPTY_PAGE)
  })

  it('retombe sur une page vide quand le fetch échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { fetchTagValuePortfolioImages } = await loadModule()

    await expect(fetchTagValuePortfolioImages('tag-1')).resolves.toEqual(EMPTY_PAGE)
  })
})
