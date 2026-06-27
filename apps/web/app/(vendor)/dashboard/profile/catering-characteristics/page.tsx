import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
import CateringCharacteristicsForm from './_components/CateringCharacteristicsForm'

export default async function CateringCharacteristicsPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')
  if (dashboard.vendorType !== 'traiteur') redirect('/dashboard/profile')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · VITRINE"
        title={<>Votre offre <em className="font-cormorant italic text-accent">traiteur.</em></>}
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <CateringCharacteristicsForm vendorId={dashboard.id} />
        </div>
      </div>
    </div>
  )
}
