import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
import VenueCharacteristicsForm from './_components/VenueCharacteristicsForm'

export default async function VenueCharacteristicsPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')
  if (dashboard.vendorType !== 'lieu') redirect('/dashboard/profile')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · VITRINE"
        title={<>Votre <em className="font-cormorant italic text-accent">lieu.</em></>}
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <VenueCharacteristicsForm vendorId={dashboard.id} />
        </div>
      </div>
    </div>
  )
}
