import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHero from '@/components/vendor/ProfileHero'
import ExperiencesForm from './_components/ExperiencesForm'

export default async function ExperiencesPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  return (
    <div className="bg-creme min-h-screen">
      <ProfileHero
        breadcrumb="MON PROFIL · MATCHING"
        title={<>Vos expériences <em className="font-cormorant italic text-accent">de mariage.</em></>}
        backHref="/vendor/dashboard/profile"
      />
      <ExperiencesForm vendorId={dashboard.id} />
    </div>
  )
}
