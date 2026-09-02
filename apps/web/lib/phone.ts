/**
 * Le format de téléphone français accepté par l'API, côté navigateur.
 *
 * Miroir de `App\Validator\Constraints\FrenchPhoneNumber`. Le backend a
 * délibérément extrait une contrainte *partagée* entre l'inscription couple et
 * l'onboarding prestataire pour que les deux parcours ne puissent plus diverger
 * sur ce qu'ils acceptent (WED-216) ; ce module est son pendant front, pour la
 * même raison.
 *
 * Il valide, il ne normalise pas : la conversion en `+33` du numéro persisté
 * appartient au service qui écrit (COUPLE-ONBOARDING-010).
 */
const FRENCH_PHONE_PATTERN = /^(\+33|0)[1-9]\d{8}$/

/**
 * Retire ce qu'on tape pour aérer un numéro. Sans ça, « 06 12 34 56 78 » —
 * la façon dont un numéro s'écrit en France — sortirait en 422.
 */
export function cleanPhoneInput(phone: string): string {
  return phone.replace(/[\s.\-()]/g, '')
}

/**
 * Un numéro absent n'est pas un numéro invalide : le champ est optionnel dans
 * les deux parcours, et l'absence de réponse n'est pas une erreur de saisie.
 */
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = cleanPhoneInput(phone)

  return cleaned === '' || FRENCH_PHONE_PATTERN.test(cleaned)
}
