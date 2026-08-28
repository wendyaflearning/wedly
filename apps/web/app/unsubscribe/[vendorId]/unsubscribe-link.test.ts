import { describe, expect, it } from 'vitest'
import { isValidVendorId } from './unsubscribe-link'

describe('isValidVendorId', () => {
  it('accepte un UUID bien formé', () => {
    expect(isValidVendorId('01996f0e-1b2c-7d3e-8f40-5a6b7c8d9e0f')).toBe(true)
  })

  it('accepte la casse mixte', () => {
    expect(isValidVendorId('01996F0E-1b2C-7D3e-8F40-5a6B7c8D9e0F')).toBe(true)
  })

  it('refuse une chaîne de 36 tirets, que le filtre de routeur backend laisserait passer', () => {
    expect(isValidVendorId('-'.repeat(36))).toBe(false)
  })

  it('refuse un UUID sans ses tirets', () => {
    expect(isValidVendorId('01996f0e1b2c7d3e8f405a6b7c8d9e0f')).toBe(false)
  })

  it('refuse un UUID tronqué ou rallongé', () => {
    expect(isValidVendorId('01996f0e-1b2c-7d3e-8f40-5a6b7c8d9e0')).toBe(false)
    expect(isValidVendorId('01996f0e-1b2c-7d3e-8f40-5a6b7c8d9e0ff')).toBe(false)
  })

  it('refuse un caractère hors hexadécimal', () => {
    expect(isValidVendorId('01996f0e-1b2c-7d3e-8f40-5a6b7c8d9e0z')).toBe(false)
  })

  it('refuse une chaîne vide', () => {
    expect(isValidVendorId('')).toBe(false)
  })
})
