import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { fetchPricingZone } from '@/lib/pricingZone'
import PricingZoneForm from './_components/PricingZoneForm'

export default async function PricingZonePage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const initialData = await fetchPricingZone(dashboard.id)

  return (
    <div className="bg-creme min-h-screen">
      <section className="bg-bordeaux text-creme px-5 pt-6 pb-8 md:px-[72px] md:pt-14 md:pb-16 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-32 h-32 md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative">
          <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-creme/40 mb-3 md:mb-4">
            MON PROFIL · MATCHING
          </p>
          <h1 className="font-cormorant text-[32px] md:text-[52px] font-light leading-tight text-creme">
            Tarifs{' '}
            <em className="font-cormorant italic text-accent">& zone.</em>
          </h1>
        </div>
      </section>

      <PricingZoneForm vendorId={dashboard.id} initialData={initialData} />
    </div>
  )
}
