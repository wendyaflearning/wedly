import { redirect } from 'next/navigation'
import { fetchVendorDashboard, fetchVendorPortfolio } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'
import ProfileMobileNav from '@/components/vendor/ProfileMobileNav'
import PortfolioPageClient from './_components/PortfolioPageClient'

export default async function PortfolioPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const photos = await fetchVendorPortfolio(dashboard.id)

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL"
        title={<>Votre <em className="font-cormorant italic text-accent">portfolio.</em></>}
        backHref="/dashboard/profile"
      />
      <div className="max-w-[1200px] mx-auto md:px-[72px] md:flex md:gap-14">
        <div className="hidden md:block pt-10">
          <ProfileSidebar />
        </div>
        <div className="flex-1 min-w-0 pb-20">
          <ProfileMobileNav />
          <div className="px-5 md:px-0 pt-8">
            <PortfolioPageClient initialPhotos={photos} vendorId={dashboard.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
