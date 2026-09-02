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

const VENDOR = '0198a1c0-0000-7000-8000-0000000000bb'

const EMPTY = { pins: {}, contacts: {} }

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

    await expect(fetchStatuses()).resolves.toEqual(EMPTY)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retient l’épingle par photo et la demande par prestataire', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [PINS]: jsonResponse({ items: [{ portfolioImageId: 'photo-1' }] }),
        [LEADS]: jsonResponse({
          items: [{ portfolioImageId: 'photo-2', vendorId: VENDOR, status: 'EN_ATTENTE' }],
        }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      pins: { 'photo-1': 'done' },
      contacts: { [VENDOR]: { status: 'done', leadStatus: 'EN_ATTENTE' } },
    })
  })

  /**
   * Les deux statuts qui changent ce que la lightbox affiche (WED-186). Ils
   * doivent arriver dès le rendu serveur : sinon le couple qui rouvre la galerie
   * relit « Demande envoyée » sur un prestataire qui a déjà tranché, jusqu'à ce
   * qu'il reclique. Rangés sous le prestataire depuis WED-195, donc valables sur
   * toutes ses photos et plus seulement sur celle d'où la demande est partie.
   */
  it('retient un refus dès la lecture serveur', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({
          items: [{ portfolioImageId: 'photo-3', vendorId: VENDOR, status: 'REFUSEE' }],
        }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      pins: {},
      contacts: { [VENDOR]: { status: 'done', leadStatus: 'REFUSEE' } },
    })
  })

  it('retient une demande débloquée dès la lecture serveur', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({
          items: [{ portfolioImageId: 'photo-3', vendorId: VENDOR, status: 'DEBLOQUEE' }],
        }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      pins: {},
      contacts: { [VENDOR]: { status: 'done', leadStatus: 'DEBLOQUEE' } },
    })
  })

  /**
   * Le cœur de WED-195 : la demande est partie de `photo-2`, et c'est le
   * prestataire qui est retenu — c'est ce qui permet à `photo-3`, du même
   * prestataire, de s'ouvrir déjà marquée « Demande envoyée » (CA2).
   */
  it('ne retient pas la photo d’où la demande est partie', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({
          items: [{ portfolioImageId: 'photo-2', vendorId: VENDOR, status: 'EN_ATTENTE' }],
        }),
      })
    )

    const statuses = await fetchStatuses()

    expect(statuses.contacts).toEqual({ [VENDOR]: { status: 'done', leadStatus: 'EN_ATTENTE' } })
    expect(statuses.contacts['photo-2']).toBeUndefined()
  })

  /**
   * Une demande partie hors galerie n'a pas de photo de départ, mais elle a bien
   * un prestataire : ses photos doivent se marquer comme les autres.
   */
  it('retient une demande sans photo de départ', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({
          items: [{ portfolioImageId: null, vendorId: VENDOR, status: 'EN_ATTENTE' }],
        }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual({
      pins: {},
      contacts: { [VENDOR]: { status: 'done', leadStatus: 'EN_ATTENTE' } },
    })
  })

  /** Un backend antérieur à WED-195 ne doit pas marquer toutes les photos. */
  it('ignore une demande sans identifiant de prestataire', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal(
      'fetch',
      respondBy({
        [LEADS]: jsonResponse({ items: [{ portfolioImageId: 'photo-2', status: 'EN_ATTENTE' }] }),
      })
    )

    await expect(fetchStatuses()).resolves.toEqual(EMPTY)
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

    await expect(fetchStatuses()).resolves.toEqual({ pins: { 'photo-1': 'done' }, contacts: {} })
  })

  /**
   * Un compte prestataire connecté prend un 403 sur les deux endpoints : la
   * galerie s'affiche à l'état idle plutôt que de tomber en erreur.
   */
  it('retombe sur un état vide quand les deux appels sont refusés', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'forbidden' }, false)))

    await expect(fetchStatuses()).resolves.toEqual(EMPTY)
  })

  it('ne fait pas planter le rendu quand le réseau tombe', async () => {
    cookieGet.mockReturnValue({ value: 'jwt' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))

    await expect(fetchStatuses()).resolves.toEqual(EMPTY)
  })
})
