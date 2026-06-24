import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { fetchAvailability } from '@/lib/availability'
import AvailabilityCalendar from './_components/AvailabilityCalendar'

export default async function AvailabilityPage() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const blockers = await fetchAvailability()

  return (
    <div className="bg-creme min-h-screen">

      {/* Hero bordeaux */}
      <section className="bg-bordeaux text-creme px-5 pt-6 pb-8 md:px-[72px] md:pt-14 md:pb-16 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-32 h-32 md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto flex gap-10 md:gap-14 relative">
          {/* Mini sidebar — desktop only */}
          <div className="hidden md:block w-56 shrink-0">
            <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-creme/40 mb-2">
              MON PROFIL
            </p>
            <p className="font-manrope text-creme/50 text-sm">
              Étape{' '}
              <span className="font-semibold text-accent">03</span>
              {' '}/ 06
            </p>
          </div>

          {/* Title */}
          <div className="flex-1">
            <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-creme/40 mb-3 md:mb-4">
              ÉTAPE 01 · MON PROFIL
            </p>
            <h1 className="font-cormorant text-[32px] md:text-[52px] font-light leading-tight text-creme mb-3 md:mb-5">
              Renseignez vos{' '}
              <em className="text-accent">disponibilités.</em>
            </h1>
            <p className="font-cormorant text-creme/65 text-[15px] md:text-base max-w-xl leading-relaxed italic">
              Bloquez les jours déjà pris. Tout est libre par défaut,
              recliquez pour rouvrir.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive calendar section */}
      <AvailabilityCalendar
        initialBlockers={blockers}
        steps={dashboard.steps}
      />
    </div>
  )
}
