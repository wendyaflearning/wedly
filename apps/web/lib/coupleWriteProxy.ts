import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

/** Les seules méthodes que ce proxy sert aujourd'hui. */
type CoupleWriteMethod = 'POST' | 'DELETE'

/**
 * Écritures « coup de cœur » d'un couple connecté : épingler (WED-155),
 * dé-épingler (WED-183) et demander une mise en relation (WED-156). Les trois
 * Route Handlers sont le même proxy au path et à la méthode près, d'où
 * l'extraction — volontairement limitée à ces trois appels, aucune abstraction
 * pour d'hypothétiques futures écritures couple.
 *
 * Cookie absent : on répond 401 sans appeler Symfony. Ce n'est pas un contrôle
 * d'authentification anticipé — la décision verrouillée #2 de WED-49 interdit de
 * vérifier la session au chargement de la page, pas au moment de l'écriture.
 * C'est bien la tentative d'écriture qui tranche, elle se contente de trancher
 * ici plutôt qu'après un aller-retour réseau dont la réponse est connue.
 *
 * Le status backend remonte inchangé : 401 (pas de session), 403 (session qui
 * n'est pas un couple) et 422 (photo refusée par VendorResolver) ont chacun un
 * sens différent côté client, et aucune branche de rôle n'est faite ici — un
 * prestataire connecté est un 403 comme un autre (WED-157, CA3).
 */
export async function forwardCoupleWrite(
  request: NextRequest,
  apiPath: string,
  method: CoupleWriteMethod = 'POST'
): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Le DELETE n'a pas de corps : le parser quand même ferait échouer le proxy
  // sur une requête pourtant valide, avant même d'avoir appelé Symfony.
  const body = method === 'DELETE' ? undefined : JSON.stringify(await request.json())

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${apiPath}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      Cookie: `jwt_token=${token.value}`,
    },
    body,
  })

  if (!res.ok) return upstreamError(res)

  // Symétrique du corps de requête : un 204 n'a rien à décoder, et `res.json()`
  // lèverait sur une réponse vide.
  if (res.status === 204) return new NextResponse(null, { status: 204 })

  // 201 (créé) et 200 (déjà contacté) sont deux succès que seul le backend sait
  // distinguer : on les transmet tels quels plutôt que de les aplatir.
  return NextResponse.json(await res.json(), { status: res.status })
}
