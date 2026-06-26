import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import VenueCharacteristicsForm from './_components/VenueCharacteristicsForm'

export default async function VenueCharacteristicsPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · VITRINE"
        title={<>Votre <em className="font-cormorant italic text-accent">lieu.</em></>}
        backHref="/vendor/dashboard/profile"
      />
      <VenueCharacteristicsForm vendorId={dashboard.id} />
    </div>
  )
}
