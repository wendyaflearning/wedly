import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { DashboardHero } from './_components/DashboardHero'
import { DashboardSteps } from './_components/DashboardSteps'
import PasswordResetBanner from './_components/PasswordResetBanner'
import { GuideProvider, GuideTrigger } from './_components/DashboardGuide'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ password_reset?: string }>
}) {
  const data   = await fetchVendorDashboard()
  if (!data) redirect('/login')

  const params             = await searchParams
  const showPasswordBanner = params.password_reset === 'success'

  const mobileTrigger = (
    <GuideTrigger className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-creme/[0.22] font-manrope text-[10px] font-medium tracking-[0.12em] uppercase text-creme/75 hover:text-creme transition-colors cursor-pointer">
      <span className="w-[5px] h-[5px] rounded-full bg-dore/70 shrink-0" />
      Relancer le guide
    </GuideTrigger>
  )

  const desktopTrigger = (
    <GuideTrigger className="inline-flex items-center gap-2.5 px-[18px] py-2 rounded-full bg-creme border border-bordeaux/[0.08] text-bordeaux font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase hover:bg-creme/90 transition-colors cursor-pointer">
      <span className="w-1.5 h-1.5 rounded-full bg-highlight shrink-0" />
      Relancer le guide
    </GuideTrigger>
  )

  return (
    <GuideProvider vendorServices={data.vendorServices}>
      <div className="relative">
        {showPasswordBanner && <PasswordResetBanner />}
        <DashboardHero
          firstName={data.firstName}
          guideButton={mobileTrigger}
          desktopGuideButton={desktopTrigger}
        />
        <DashboardSteps sections={data.sections_status} />
      </div>
    </GuideProvider>
  )
}
