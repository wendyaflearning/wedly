import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitCtaAction } from './wedream-cta'

const PHOTO_ID = '0198a1c0-0000-7000-8000-000000000001'

function mockFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('submitCtaAction', () => {
  it('poste sur le Route Handler du geste, jamais sur Symfony', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201 })

    await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(fetchMock).toHaveBeenCalledWith('/api/couples/me/pins', expect.anything())
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ portfolioImageId: PHOTO_ID })
  })

  it('route le contact vers les provider-leads', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201 })

    await submitCtaAction({ kind: 'contact', portfolioImageId: PHOTO_ID })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/couples/me/provider-leads')
  })

  it('n’envoie que la photo : ni vendorId ni identifiant de couple', async () => {
    const fetchMock = mockFetch({ ok: true, status: 201 })

    await submitCtaAction({ kind: 'contact', portfolioImageId: PHOTO_ID })

    expect(Object.keys(JSON.parse(fetchMock.mock.calls[0][1].body))).toEqual(['portfolioImageId'])
  })

  it('traite le 200 comme un succès au même titre que le 201', async () => {
    mockFetch({ ok: true, status: 200 })

    const outcome = await submitCtaAction({ kind: 'contact', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({ status: 'done' })
  })

  it('demande une authentification sur 401', async () => {
    mockFetch({ ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) })

    const outcome = await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({ status: 'auth_required' })
  })

  it('traite le 403 exactement comme le 401, sans regarder le rôle', async () => {
    mockFetch({ ok: false, status: 403, json: async () => ({ error: 'Access Denied.' }) })

    const outcome = await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({ status: 'auth_required' })
  })

  it('remonte le message du backend sur une erreur métier, sans la confondre avec l’auth', async () => {
    mockFetch({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Cette photo n’est pas publiée dans Wedream.' }),
    })

    const outcome = await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({
      status: 'error',
      message: 'Cette photo n’est pas publiée dans Wedream.',
    })
  })

  it('retombe sur un message générique quand la réponse d’erreur n’est pas exploitable', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json')
      },
    })

    const outcome = await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({ status: 'error', message: 'Une erreur est survenue. Réessayez.' })
  })

  it('ne met pas en file d’attente une coupure réseau : c’est une erreur, pas une session manquante', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const outcome = await submitCtaAction({ kind: 'pin', portfolioImageId: PHOTO_ID })

    expect(outcome).toEqual({ status: 'error', message: 'Une erreur est survenue. Réessayez.' })
  })
})
