import { redirect } from 'next/navigation'
import { fetchVendorDashboard, fetchVendorPortfolio } from '@/lib/vendor'
import { WedreamVisibilityClient } from './_components/WedreamVisibilityClient'

export default async function WedreamPage() {
  // Le portfolio alimente la preview « Comment un couple vous découvre » (WED-121).
  // Endpoint déjà existant, appelé côté serveur : aucun fetch navigateur ajouté.
  const [data, photos] = await Promise.all([fetchVendorDashboard(), fetchVendorPortfolio()])
  if (!data) redirect('/login')

  return (
    <WedreamVisibilityClient
      wedreamEnabled={data.wedream_enabled}
      vendorServices={data.vendorServices ?? []}
      portfolioPhotos={photos}
    />
  )
}
