import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { fetchPricingZone } from '@/lib/pricingZone'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
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
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <PricingZoneForm vendorId={dashboard.id} initialData={initialData} />
        </div>
      </div>
    </div>
  )
}
