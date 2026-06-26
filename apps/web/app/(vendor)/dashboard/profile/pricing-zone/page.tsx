import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { fetchPricingZone } from '@/lib/pricingZone'
import ProfileHero from '@/components/vendor/ProfileHero'
import PricingZoneForm from './_components/PricingZoneForm'

export default async function PricingZonePage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const initialData = await fetchPricingZone(dashboard.id)

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · MATCHING"
        title={<>Tarifs <em className="font-cormorant italic text-accent">& zone.</em></>}
      />
      <PricingZoneForm vendorId={dashboard.id} initialData={initialData} />
    </div>
  )
}
