import { PendingActionsBadge } from '@/components/wedream/PendingActionsBadge'
import { PendingActionsProvider } from '@/components/wedream/PendingActionsProvider'

/**
 * Le layout n'existe que pour porter le badge des gestes en attente (WED-161).
 *
 * Il n'ajoute aucun habillage : chaque page de Wedream pose déjà son propre fond
 * et sa propre largeur, et le badge est en `fixed` — l'envelopper d'un conteneur
 * stylé ne ferait que dupliquer ce qui existe.
 *
 * C'est ce niveau, et pas la page, qui garantit la persistance : React ne
 * démonte pas un layout entre `/wedream-vendors`, `/wedream-vendors/[slug]` et
 * `/wedream-vendors/[slug]/[tagValueId]`, donc les compteurs traversent la
 * navigation sans repasser par le stockage.
 */
export default function WedreamVendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PendingActionsProvider>
      {children}
      <PendingActionsBadge />
    </PendingActionsProvider>
  )
}
