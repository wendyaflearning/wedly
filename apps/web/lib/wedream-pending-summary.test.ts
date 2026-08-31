import { describe, expect, it } from 'vitest'
import {
  contactCountLabel,
  countPendingActions,
  hasPendingActions,
  pinCountLabel,
} from './wedream-pending-summary'
import type { PendingAction } from './wedream-pending-actions'

const PHOTO_A = '0198a1c0-0000-7000-8000-000000000001'
const PHOTO_B = '0198a1c0-0000-7000-8000-000000000002'

function action(kind: PendingAction['kind'], portfolioImageId: string): PendingAction {
  return { kind, portfolioImageId, timestamp: 1_000 }
}

describe('comptage de la file', () => {
  it('sépare les épingles des demandes de mise en relation', () => {
    const counts = countPendingActions([
      action('pin', PHOTO_A),
      action('contact', PHOTO_A),
      action('pin', PHOTO_B),
    ])

    expect(counts).toEqual({ pinCount: 2, contactCount: 1 })
  })

  it('rend deux compteurs à zéro sur une file vide', () => {
    expect(countPendingActions([])).toEqual({ pinCount: 0, contactCount: 0 })
    expect(hasPendingActions({ pinCount: 0, contactCount: 0 })).toBe(false)
  })

  it('considère la file peuplée dès qu’un seul des deux compteurs bouge', () => {
    expect(hasPendingActions({ pinCount: 1, contactCount: 0 })).toBe(true)
    expect(hasPendingActions({ pinCount: 0, contactCount: 1 })).toBe(true)
  })
})

describe('libellés français', () => {
  it('accorde « coup de cœur » à partir de deux', () => {
    expect(pinCountLabel(1)).toBe('1 coup de cœur')
    expect(pinCountLabel(2)).toBe('2 coups de cœur')
    expect(pinCountLabel(12)).toBe('12 coups de cœur')
  })

  it('accorde « demande en attente » à partir de deux', () => {
    expect(contactCountLabel(1)).toBe('1 demande en attente')
    expect(contactCountLabel(3)).toBe('3 demandes en attente')
  })

  it('ne dit jamais qu’une demande est envoyée', () => {
    expect(contactCountLabel(1)).toContain('en attente')
    expect(contactCountLabel(2)).not.toContain('envoy')
  })
})
