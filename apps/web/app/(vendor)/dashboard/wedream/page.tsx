import { redirect } from 'next/navigation'
import {
  fetchVendorDashboard,
  fetchVendorPortfolio,
  fetchVendorProviderLeads,
} from '@/lib/vendor'
import { WedreamVisibilityClient } from './_components/WedreamVisibilityClient'

export default async function WedreamPage() {
  // Le portfolio alimente la preview « Comment un couple vous découvre » (WED-121).
  // Endpoint déjà existant, appelé côté serveur : aucun fetch navigateur ajouté.
  // Les demandes décident lequel des trois états de la section s'affiche (WED-52).
  // `null` (lecture impossible) retombe sur la même vue que « aucune demande » :
  // l'écran reste lisible, il n'invente simplement pas de liste.
  const [data, photos, leads] = await Promise.all([
    fetchVendorDashboard(),
    fetchVendorPortfolio(),
    fetchVendorProviderLeads(),
  ])
  if (!data) redirect('/login')

  return (
    <WedreamVisibilityClient
      wedreamEnabled={data.wedream_enabled}
      vendorServices={data.vendorServices ?? []}
      portfolioPhotos={photos}
      leads={leads ?? []}
    />
  )
}
