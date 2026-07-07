export function validateVendorFeedbackMessage(message: string): string | null {
  if (message.trim().length === 0) {
    return 'Décrivez votre retour avant de l’envoyer.'
  }

  return null
}
