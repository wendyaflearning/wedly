import { describe, expect, it } from 'vitest'
import { validateVendorFeedbackMessage } from './vendor-feedback'

describe('validateVendorFeedbackMessage', () => {
  it('refuse un message vide ou composé d’espaces', () => {
    expect(validateVendorFeedbackMessage('   ')).toBe('Décrivez votre retour avant de l’envoyer.')
  })

  it('refuse un message trop long', () => {
    expect(validateVendorFeedbackMessage('a'.repeat(5001))).toBe('Le message ne peut pas dépasser 5000 caractères.')
  })

  it('accepte un message non vide', () => {
    expect(validateVendorFeedbackMessage('Bonjour, j’ai un souci sur mon profil.')).toBeNull()
  })
})
