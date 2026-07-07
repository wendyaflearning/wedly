export function validateVendorFeedbackMessage(message: string): string | null {
  if (message.trim().length === 0) {
    return 'Décrivez votre retour avant de l’envoyer.'
  }

  if (message.length > 5000) {
    return 'Le message ne peut pas dépasser 5000 caractères.'
  }

  return null
}
