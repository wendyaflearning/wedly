import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPendingActions } from './wedream-pending-flush'
import {
  WEDREAM_PENDING_ACTIONS_KEY,
  type PendingAction,
  type StorageLike,
} from './wedream-pending-actions'

const PHOTO_A = '0198a1c0-0000-7000-8000-00000000000a'
const PHOTO_B = '0198a1c0-0000-7000-8000-00000000000b'
const PHOTO_C = '0198a1c0-0000-7000-8000-00000000000c'

/** Un stockage en mémoire : la file n'a jamais besoin d'un vrai localStorage. */
function storageWith(queue: PendingAction[]): StorageLike & { raw: () => string | null } {
  let stored: string | null = JSON.stringify(queue)

  return {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
    removeItem: () => {
      stored = null
    },
    raw: () => stored,
  }
}

function pending(kind: 'pin' | 'contact', portfolioImageId: string): PendingAction {
  return { kind, portfolioImageId, timestamp: Date.now() }
}

/** Une réponse par appel, dans l'ordre : le rejeu est séquentiel. */
function mockFetchSequence(statuses: number[]) {
  const fetchMock = vi.fn()
  for (const status of statuses) {
    fetchMock.mockResolvedValueOnce({
      ok: status < 400,
      status,
      json: async () => ({ error: 'Cette photo n’est plus disponible.' }),
    })
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('rejeu de la file après authentification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ne tente rien quand le stockage est refusé par le navigateur', async () => {
    const fetchMock = mockFetchSequence([])

    expect(await flushPendingActions(null)).toEqual({ done: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ne tente rien sur une file vide', async () => {
    const fetchMock = mockFetchSequence([])

    expect(await flushPendingActions(storageWith([]))).toEqual({ done: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejoue chaque geste sur l’endpoint de son type et compte les succès', async () => {
    const fetchMock = mockFetchSequence([201, 201])
    const storage = storageWith([pending('pin', PHOTO_A), pending('contact', PHOTO_B)])

    expect(await flushPendingActions(storage)).toEqual({ done: 2 })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/couples/me/pins')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/couples/me/provider-leads')
  })

  it('compte un geste déjà enregistré comme un succès, pas comme un échec', async () => {
    // 200 = le backend a répondu « déjà épinglé / déjà contacté ». Le geste du
    // couple a bien abouti, il doit compter dans la confirmation qu'on lui montre.
    const storage = storageWith([pending('contact', PHOTO_A)])
    mockFetchSequence([200])

    expect(await flushPendingActions(storage)).toEqual({ done: 1 })
  })

  it('laisse passer les autres gestes quand l’un d’eux échoue', async () => {
    // Photo du milieu masquée dans Wedream entre-temps : 422, et les deux autres
    // ne doivent pas en pâtir.
    const fetchMock = mockFetchSequence([201, 422, 201])
    const storage = storageWith([
      pending('pin', PHOTO_A),
      pending('pin', PHOTO_B),
      pending('pin', PHOTO_C),
    ])

    expect(await flushPendingActions(storage)).toEqual({ done: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('vide la file même quand une partie a échoué', async () => {
    const storage = storageWith([pending('pin', PHOTO_A), pending('pin', PHOTO_B)])
    mockFetchSequence([422, 422])

    expect(await flushPendingActions(storage)).toEqual({ done: 0 })
    // Rien ne doit rester : une photo refusée le sera encore à la prochaine
    // connexion, et la file resterait pleine d'items morts pendant 30 jours.
    expect(storage.raw()).toBeNull()
  })

  it('respecte l’ordre des gestes du couple', async () => {
    // Le backend ne garde qu'un lead par prestataire, avec la photo de la
    // première demande : l'ordre d'envoi décide laquelle il montre.
    const fetchMock = mockFetchSequence([201, 200])
    const storage = storageWith([pending('contact', PHOTO_A), pending('contact', PHOTO_B)])

    await flushPendingActions(storage)

    const sent = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body).portfolioImageId)
    expect(sent).toEqual([PHOTO_A, PHOTO_B])
  })
})
