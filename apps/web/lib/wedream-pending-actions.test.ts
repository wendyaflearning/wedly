import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACCOUNT_MODAL_SEEN_KEY,
  dequeuePendingAction,
  enqueuePendingAction,
  hasSeenAccountModal,
  loadPendingActions,
  markAccountModalSeen,
  subscribeToPendingActions,
  WEDREAM_PENDING_ACTIONS_KEY,
  WEDREAM_PENDING_ACTIONS_TTL_MS,
} from './wedream-pending-actions'

const PHOTO_A = '0198a1c0-0000-7000-8000-000000000001'
const PHOTO_B = '0198a1c0-0000-7000-8000-000000000002'

function createStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(WEDREAM_PENDING_ACTIONS_KEY, initial)

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

/** Un stockage refusé de bout en bout : Safari privé, cookies bloqués, quota plein. */
function createBrokenStorage() {
  return {
    getItem: () => {
      throw new Error('storage unavailable')
    },
    setItem: () => {
      throw new Error('storage unavailable')
    },
    removeItem: () => {
      throw new Error('storage unavailable')
    },
  }
}

/** Le stockage refusé doit laisser une trace, pas disparaître en silence. */
function silenceWarnings() {
  return vi.spyOn(console, 'warn').mockImplementation(() => {})
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('file des gestes en attente', () => {
  it('empile une entrée par geste plutôt qu’un objet unique', () => {
    const storage = createStorage()

    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    const queue = enqueuePendingAction(storage, { kind: 'contact', portfolioImageId: PHOTO_B }, 2_000)

    expect(queue).toEqual([
      { kind: 'pin', portfolioImageId: PHOTO_A, timestamp: 1_000 },
      { kind: 'contact', portfolioImageId: PHOTO_B, timestamp: 2_000 },
    ])
    expect(loadPendingActions(storage, 2_000)).toEqual(queue)
  })

  it('garde les deux gestes d’une même photo : épingler n’est pas contacter', () => {
    const storage = createStorage()

    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    const queue = enqueuePendingAction(storage, { kind: 'contact', portfolioImageId: PHOTO_A }, 1_000)

    expect(queue).toHaveLength(2)
  })

  it('ne double pas un geste rejoué sur la même photo, et rafraîchit sa date', () => {
    const storage = createStorage()

    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    const queue = enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 5_000)

    expect(queue).toEqual([{ kind: 'pin', portfolioImageId: PHOTO_A, timestamp: 5_000 }])
  })

  it('retient un geste pendant 30 jours, puis l’oublie', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(loadPendingActions(storage, 1_000 + WEDREAM_PENDING_ACTIONS_TTL_MS - 1)).toHaveLength(1)
    expect(loadPendingActions(storage, 1_000 + WEDREAM_PENDING_ACTIONS_TTL_MS)).toEqual([])
  })

  it('purge les entrées expirées à l’écriture, pas seulement à la lecture', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    const later = 1_000 + WEDREAM_PENDING_ACTIONS_TTL_MS
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_B }, later)

    expect(JSON.parse(storage.getItem(WEDREAM_PENDING_ACTIONS_KEY) ?? '[]')).toEqual([
      { kind: 'pin', portfolioImageId: PHOTO_B, timestamp: later },
    ])
  })

  it('ignore les entrées réécrites à la main sans jeter les valides', () => {
    const storage = createStorage(
      JSON.stringify([
        { kind: 'pin', portfolioImageId: PHOTO_A, timestamp: 1_000 },
        { kind: 'wishlist', portfolioImageId: PHOTO_B, timestamp: 1_000 },
        { kind: 'contact', portfolioImageId: '', timestamp: 1_000 },
        { kind: 'contact', portfolioImageId: PHOTO_B },
      ]),
    )

    expect(loadPendingActions(storage, 1_000)).toEqual([
      { kind: 'pin', portfolioImageId: PHOTO_A, timestamp: 1_000 },
    ])
  })

  it('efface une file illisible plutôt que de buter dessus à chaque lecture', () => {
    const storage = createStorage('{ pas du JSON')

    expect(loadPendingActions(storage, 1_000)).toEqual([])
    expect(storage.getItem(WEDREAM_PENDING_ACTIONS_KEY)).toBeNull()
  })

  it('efface une file qui n’est plus un tableau', () => {
    const storage = createStorage(JSON.stringify({ kind: 'pin', portfolioImageId: PHOTO_A }))

    expect(loadPendingActions(storage, 1_000)).toEqual([])
    expect(storage.getItem(WEDREAM_PENDING_ACTIONS_KEY)).toBeNull()
  })

  it('ne lève jamais quand le stockage est refusé', () => {
    silenceWarnings()
    const storage = createBrokenStorage()

    expect(loadPendingActions(storage, 1_000)).toEqual([])
    expect(() =>
      enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000),
    ).not.toThrow()
  })

  it('signale un stockage refusé plutôt que de l’avaler en silence', () => {
    const warn = silenceWarnings()

    enqueuePendingAction(createBrokenStorage(), { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(warn).toHaveBeenCalled()
    expect(String(warn.mock.calls[0][0])).toContain('wedream-pending-actions')
  })
})

describe('retrait d’un geste de la file', () => {
  it('retire le geste visé et laisse les autres en place', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_B }, 1_000)

    const queue = dequeuePendingAction(storage, 'pin', PHOTO_A, 2_000)

    expect(queue).toEqual([{ kind: 'pin', portfolioImageId: PHOTO_B, timestamp: 1_000 }])
    expect(loadPendingActions(storage, 2_000)).toEqual(queue)
  })

  it('ne retire que le geste demandé : dé-épingler ne décommande pas un contact', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    enqueuePendingAction(storage, { kind: 'contact', portfolioImageId: PHOTO_A }, 1_000)

    const queue = dequeuePendingAction(storage, 'pin', PHOTO_A, 2_000)

    expect(queue).toEqual([{ kind: 'contact', portfolioImageId: PHOTO_A, timestamp: 1_000 }])
  })

  it('est sans effet sur un geste absent de la file', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    const queue = dequeuePendingAction(storage, 'pin', PHOTO_B, 2_000)

    expect(queue).toEqual([{ kind: 'pin', portfolioImageId: PHOTO_A, timestamp: 1_000 }])
  })

  it('vide bien la file quand elle ne contenait que ce geste', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(dequeuePendingAction(storage, 'pin', PHOTO_A, 2_000)).toEqual([])
    expect(loadPendingActions(storage, 2_000)).toEqual([])
  })

  it('ne lève jamais quand le stockage est refusé', () => {
    expect(() => dequeuePendingAction(createBrokenStorage(), 'pin', PHOTO_A, 1_000)).not.toThrow()
  })
})

describe('drapeau du modal de création de compte', () => {
  it('n’est pas posé tant que le modal n’a pas été ouvert', () => {
    expect(hasSeenAccountModal(createStorage())).toBe(false)
  })

  it('reste posé une fois le modal ouvert', () => {
    const storage = createStorage()

    markAccountModalSeen(storage)

    expect(hasSeenAccountModal(storage)).toBe(true)
    expect(storage.getItem(ACCOUNT_MODAL_SEEN_KEY)).not.toBeNull()
  })

  it('ne vit pas dans la même clé que la file', () => {
    const storage = createStorage()

    markAccountModalSeen(storage)

    expect(loadPendingActions(storage, 1_000)).toEqual([])
  })

  it('se rabat sur « jamais vu » si le stockage est refusé, en le signalant', () => {
    const warn = silenceWarnings()
    const storage = createBrokenStorage()

    expect(() => markAccountModalSeen(storage)).not.toThrow()
    expect(hasSeenAccountModal(storage)).toBe(false)
    expect(warn).toHaveBeenCalledTimes(2)
  })
})

describe('abonnement aux écritures de la file', () => {
  it('prévient l’abonné dès qu’un geste est mis en file', () => {
    const storage = createStorage()
    const listener = vi.fn()
    const unsubscribe = subscribeToPendingActions(listener)

    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('prévient tous les abonnés, pas seulement le dernier', () => {
    const storage = createStorage()
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = subscribeToPendingActions(first)
    const unsubscribeSecond = subscribeToPendingActions(second)

    enqueuePendingAction(storage, { kind: 'contact', portfolioImageId: PHOTO_A }, 1_000)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    unsubscribeFirst()
    unsubscribeSecond()
  })

  it('ne rappelle plus un abonné désabonné', () => {
    const storage = createStorage()
    const listener = vi.fn()

    subscribeToPendingActions(listener)()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(listener).not.toHaveBeenCalled()
  })

  it('ne prévient personne quand l’écriture a échoué', () => {
    // Un quota plein n'a rien changé au stockage : relire la file afficherait le
    // même chiffre qu'avant, autant ne pas déclencher le rendu.
    silenceWarnings()
    const listener = vi.fn()
    const unsubscribe = subscribeToPendingActions(listener)

    enqueuePendingAction(createBrokenStorage(), { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('prévient l’abonné quand un geste sort de la file', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)
    const listener = vi.fn()
    const unsubscribe = subscribeToPendingActions(listener)

    dequeuePendingAction(storage, 'pin', PHOTO_A, 2_000)

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('ne prévient personne quand il n’y avait rien à retirer', () => {
    const storage = createStorage()
    const listener = vi.fn()
    const unsubscribe = subscribeToPendingActions(listener)

    dequeuePendingAction(storage, 'pin', PHOTO_A, 1_000)

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('ne prévient personne à la simple lecture', () => {
    const storage = createStorage()
    enqueuePendingAction(storage, { kind: 'pin', portfolioImageId: PHOTO_A }, 1_000)

    const listener = vi.fn()
    const unsubscribe = subscribeToPendingActions(listener)

    loadPendingActions(storage, 1_000)

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
