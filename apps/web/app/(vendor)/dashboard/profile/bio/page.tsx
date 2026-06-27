import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
import BioPageClient from './_components/BioPageClient'

export default async function BioPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL"
        title={<>Votre <em className="font-cormorant italic text-accent">bio.</em></>}
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ProfileMobileNav />
          <BioPageClient
            vendorId={dashboard.id}
            firstName={dashboard.firstName}
            initialBio={dashboard.bio}
            vendorServices={dashboard.vendorServices ?? []}
          />
        </div>
      </div>
    </div>
  )
}
