/**
 * Validation locale de l'identifiant porté par le lien de désinscription.
 *
 * Volontairement plus stricte que le `requirements` de la route Symfony
 * (`[0-9a-fA-F-]{36}`) : côté backend ce motif n'est qu'un filtre de routeur, le
 * vrai filet étant le lookup en base. Ici il n'y a rien derrière, donc on refuse
 * ce que le backend tolère — une chaîne de 36 tirets, par exemple.
 */
const VENDOR_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export function isValidVendorId(vendorId: string): boolean {
  return VENDOR_ID_PATTERN.test(vendorId)
}
