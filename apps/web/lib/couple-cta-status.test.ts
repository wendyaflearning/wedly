import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieGet = vi.fn()

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
}))

/**
 * `fetchInitialCtaStatuses` est mémoïsée par `cache()` : sans module neuf à
 * chaque test, le second lirait le résultat du premier.
 */
async function fetchStatuses() {
  vi.resetModules()
  const { fetchInitialCtaStatuses } = await import('./couple-cta-status')

  return fetchInitialCtaStatuses()
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

/** Les deux appels partent ensemble : on répond par path, pas par ordre d'arrivée. */
function respondBy(routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const match = Object.entries(routes).find(([path]) => url.includes(path))

    return match ? match[1] : jsonResponse({ items: [] })
  })
}

const PINS = '/couples/me/pins'
const LEADS = '/couples/me/provider-leads'

describe('fetchInitialCtaStatuses', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.wedly.test')
    cookieGet.mockReset()
    vi.unstubAllGlobals()
  })

  /** CA4 : la galerie est publique, un visiteur sans compte ne doit rien coûter. */
  it('ne touche pas le réseau quand le couple n’est pas connecté', async () => {
    cookieGet.mockReturnValue(undefined)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchStatuses()).resolves.toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('marque les photos épinglées et les photos déjà contactées', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [PINS]: jsonResponse({ items: [{ portfolioImageId: 'photo-1' }] }),
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: 'photo-2', status: 'EN_ATTENTE' }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      'photo-1': { pin: 'done' },
      'photo-2': { contact: 'done', contactLeadStatus: 'EN_ATTENTE' },
    })
  })

  /**
   * Les deux statuts qui changent ce que la lightbox affiche (WED-186). Ils
   * doivent arriver dès le rendu serveur : sinon le couple qui rouvre la galerie
   * relit « Demande envoyée » sur un prestataire qui a déjà tranché, jusqu'à ce
   * qu'il reclique.
   */
  it('retient un refus dès la lecture serveur', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: 'photo-3', status: 'REFUSEE' }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      'photo-3': { contact: 'done', contactLeadStatus: 'REFUSEE' },
    })
  })

  it('retient une demande débloquée dès la lecture serveur', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: 'photo-3', status: 'DEBLOQUEE' }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      'photo-3': { contact: 'done', contactLeadStatus: 'DEBLOQUEE' },
    })
  })

  /** Une même photo peut porter les deux gestes : le second n'écrase pas le premier. */
  it('cumule les deux gestes sur une photo à la fois épinglée et contactée', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [PINS]: jsonResponse({ items: [{ portfolioImageId: 'photo-1' }] }),
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: 'photo-1' }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      'photo-1': { pin: 'done', contact: 'done' },
    })
  })

  /** Une demande partie hors galerie n'a aucune vignette à marquer. */
  it('ignore une demande sans photo', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: null }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({})
  })

  it('garde les épingles quand la lecture des demandes échoue', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [PINS]: jsonResponse({ items: [{ portfolioImageId: 'photo-1' }] }),
        [LEADS]: jsonResponse({ error: 'boom' }, false),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({ 'photo-1': { pin: 'done' } })
  })

  /**
   * Un compte prestataire connecté prend un 403 sur les deux endpoints : la
   * galerie s'affiche à l'état idle plutôt que de tomber en erreur.
   */
  it('retombe sur un état vide quand les deux appels sont refusés', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'forbidden' }, false)))

    await expect(fetchStatuses()).resolves.toEqual({})
  })

  it('ne fait pas planter le rendu quand le réseau tombe', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))

    await expect(fetchStatuses()).resolves.toEqual({})
  })
})
