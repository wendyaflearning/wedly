import { describe, expect, it } from 'vitest'
import { validateVendorFeedbackMessage } from './vendor-feedback'

describe('validateVendorFeedbackMessage', () => {
  it('refuse un message vide ou composé d’espaces', () => {
    expect(validateVendorFeedbackMessage('   ')).toBe('Décrivez votre retour avant de l’envoyer.')
  })

  it('accepte un message non vide', () => {
    expect(validateVendorFeedbackMessage('Bonjour, j’ai un souci sur mon profil.')).toBeNull()
  })
})
