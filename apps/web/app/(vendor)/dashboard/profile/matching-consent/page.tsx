import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
import MatchingConsentForm from './_components/MatchingConsentForm'

export default async function MatchingConsentPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · MATCHING"
        title={<>Confidentialité du <em className="font-cormorant italic text-accent">matching.</em></>}
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <MatchingConsentForm vendorId={dashboard.id} />
        </div>
      </div>
    </div>
  )
}
