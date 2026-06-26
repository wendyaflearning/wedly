import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import CateringCharacteristicsForm from './_components/CateringCharacteristicsForm'

export default async function CateringCharacteristicsPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · VITRINE"
        title={<>Votre offre <em className="font-cormorant italic text-accent">traiteur.</em></>}
        backHref="/vendor/dashboard/profile"
      />
      <CateringCharacteristicsForm vendorId={dashboard.id} />
    </div>
  )
}
