import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import { ProfileContent } from '@/components/vendor/profile/ProfileContent'

export default async function ProfilPage() {
  const data = await fetchVendorDashboard()
  if (!data) redirect('/login')

  return (
    <div>
      {/* Hero bordeaux */}
      <section className="bg-bordeaux text-creme px-5 pt-6 pb-8 md:px-[72px] md:pt-12 md:pb-14 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-[130px] h-[130px] md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className="font-manrope text-[10px] font-semibold tracking-[0.2em] uppercase text-creme/50">
              Étape 03 · Mon Profil
            </span>
            <span className="text-creme/25 text-xs">——</span>
            <span className="font-cormorant italic text-sm text-creme/45">Étape 03&nbsp;/ 06</span>
          </div>

          {/* Titre */}
          <h1 className="font-cormorant font-light text-[34px] md:text-[56px] leading-[1.05] tracking-[-0.015em] text-creme">
            Complétez{' '}
            <em style={{ color: 'var(--color-dore)' }}>votre bio.</em>
          </h1>

          {/* Sous-titre */}
          <p className="hidden md:block font-manrope text-sm text-creme/60 mt-4 max-w-[640px] leading-relaxed">
            Un champ unique, des suggestions progressives. Commencez par quelques mots — votre style,
            vos mariages, ce qui vous rend unique. Wedly guide sans contraindre.
          </p>
          <p className="md:hidden font-manrope text-sm text-creme/60 mt-3 leading-relaxed">
            Écrivez librement — trois suggestions progressives vous guident.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <ProfileContent
        firstName={data.firstName}
        initialBio={data.bio}
        vendorServices={data.vendor_services ?? []}
        steps={data.steps}
      />
    </div>
  )
}
