import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { fetchAvailability } from '@/lib/availability'
import AvailabilityCalendar from './_components/AvailabilityCalendar'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'

export default async function AvailabilityPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const blockers = await fetchAvailability()

  return (
    <div className="bg-creme min-h-screen">

      {/* Hero bordeaux */}
      <ProfileHero
          breadcrumb="MON PROFIL"
          title={<>Renseignez vos <em className="font-cormorant italic text-accent">disponibilités.</em></>}
          backHref="/dashboard/profile"
      />

      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <AvailabilityCalendar initialBlockers={blockers} />
        </div>
      </div>
    </div>
  )
}
