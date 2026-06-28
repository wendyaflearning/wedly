import { redirect } from 'next/navigation'
import { VendorNav } from '@/components/vendor/VendorNav'
import { fetchVendorDashboard } from '@/lib/vendor'

function VendorAccessBlockedScreen({ status }: { status: 'pending' | 'under_review' | 'active' | 'rejected' }) {
  const isPendingValidation = status === 'pending' || status === 'under_review'
  const title = isPendingValidation ? 'Profil en attente de validation' : 'Profil non validé'
  const message = isPendingValidation
    ? 'Profil en attente de validation - cela peut prendre 24h à 48h.'
    : "Votre profil n'est pas accessible pour le moment."

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <section className="w-full max-w-[720px] rounded-lg border border-bordeaux/10 bg-white px-6 py-12 text-center shadow-sm md:px-12">
        <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
          Espace prestataire
        </p>
        <h1 className="mt-4 font-cormorant text-[34px] font-semibold leading-tight text-bordeaux md:text-[44px]">
          {title}
        </h1>
        <p className="mt-5 text-[16px] leading-7 text-gris">
          {message}
        </p>
      </section>
    </main>
  )
}

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const sections = dashboard.sections_status
  const allSectionsComplete = sections.general_info
    && sections.pricing_zone
    && sections.experiences
    && sections.bio
    && sections.portfolio
    && sections.booking_blocker
  const isActive = dashboard.status === 'active'
  const isPendingValidation = dashboard.status === 'pending' || dashboard.status === 'under_review'
  const vendorStatus = dashboard.status === 'active'
    ? allSectionsComplete ? 'EN LIGNE' : 'EN PRÉPARATION'
    : isPendingValidation
      ? 'EN ATTENTE'
      : 'NON VALIDÉ'

  return (
    <div className="min-h-screen bg-creme">
      <VendorNav
        vendorFirstName={dashboard.firstName}
        vendorLastName={dashboard.lastName ?? ''}
        vendorEmail={dashboard.email}
        vendorStatus={vendorStatus}
      />
      {isActive ? <main className="pb-20 md:pb-0">{children}</main> : <VendorAccessBlockedScreen status={dashboard.status} />}
    </div>
  )
}
