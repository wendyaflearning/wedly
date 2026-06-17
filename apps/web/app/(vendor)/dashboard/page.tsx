import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { DashboardHero } from './_components/DashboardHero'
import { DashboardSteps } from './_components/DashboardSteps'
import PasswordResetBanner from './_components/PasswordResetBanner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ password_reset?: string }>
}) {
  const data   = await fetchVendorDashboard()
  if (!data) redirect('/login')

  const params             = await searchParams
  const showPasswordBanner = params.password_reset === 'success'

  return (
    <div className="relative">
      {showPasswordBanner && <PasswordResetBanner />}
      {/* Bouton "Relancer le guide" — dark pill sur mobile, transparent sur desktop */}
      <button className="absolute top-[68px] right-4 md:top-[92px] md:right-12 z-30 inline-flex items-center gap-2 md:gap-2.5 px-3.5 md:px-[18px] py-2 md:py-2.5 rounded-full border border-creme/[0.35] md:border-bordeaux/[0.18] bg-bordeaux/[0.92] md:bg-transparent text-creme md:text-bordeaux font-manrope text-[10px] md:text-[11px] font-semibold tracking-[0.12em] md:tracking-[0.14em] uppercase cursor-pointer hover:bg-bordeaux md:hover:bg-bordeaux/5 transition-colors">
        <span className="w-[5px] h-[5px] md:w-1.5 md:h-1.5 rounded-full bg-dore md:bg-highlight" />
        Relancer le guide
      </button>

      <DashboardHero firstName={data.firstName} />
      <DashboardSteps steps={data.steps} />
    </div>
  )
}
