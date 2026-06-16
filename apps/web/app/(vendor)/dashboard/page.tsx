import { DashboardHero } from './_components/DashboardHero'
import { DashboardSteps } from './_components/DashboardSteps'

// TODO: remplacer par les données de session quand l'auth est en place
const VENDOR_FIRST_NAME = 'Claire'
const STEPS = {
  availability: false,
  portfolio: false,
  bio: false,
  published: false,
}

export default function DashboardPage() {
  return (
    <div className="relative">
      {/* Bouton flottant "Relancer le guide" */}
      <button className="absolute right-12 top-[92px] z-30 inline-flex items-center gap-2.5 px-[18px] py-2.5 rounded-full border border-bordeaux/[0.18] bg-transparent font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase text-bordeaux transition-colors hover:bg-bordeaux/5 cursor-pointer">
        <span className="w-1.5 h-1.5 rounded-full bg-highlight" />
        Relancer le guide
      </button>

      <DashboardHero firstName={VENDOR_FIRST_NAME} />
      <DashboardSteps steps={STEPS} />
    </div>
  )
}
