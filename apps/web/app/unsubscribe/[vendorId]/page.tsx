import UnsubscribeConfirm from './UnsubscribeConfirm'
import { isValidVendorId } from './unsubscribe-link'

// Motif repris de ExpiredInvitationScreen (app/onboarding/[token]/page.tsx) — extraire
// en composant partagé si un 3e usage apparaît. Deux usages ne le justifient pas encore.
function InvalidLinkScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-6 text-center text-texte">
      <div className="max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-highlight">Lien invalide</p>
        <h1 className="mt-4 font-cormorant text-[34px] font-semibold leading-tight text-bordeaux">
          Ce lien n’est pas valide.
        </h1>
        <p className="mt-4 text-base leading-7 text-gris">
          Il a peut-être été tronqué en chemin. Réouvrez le lien depuis l’email d’origine, ou
          écrivez-nous à contact@wedly-apps.com.
        </p>
      </div>
    </div>
  )
}

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ vendorId: string }>
}) {
  const { vendorId } = await params

  // Aucun appel réseau ici : un lien mal formé n'a pas besoin de Symfony pour être
  // reconnu comme invalide.
  if (!isValidVendorId(vendorId)) return <InvalidLinkScreen />

  return <UnsubscribeConfirm vendorId={vendorId} />
}
