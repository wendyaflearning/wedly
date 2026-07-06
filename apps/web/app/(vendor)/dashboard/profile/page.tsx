import { redirect } from 'next/navigation'
import { fetchVendorDashboard } from '@/lib/vendor'
import ProfileHubClient, { type Section, type SectionGroup } from './_components/ProfileHubClient'
import ProfileSidebar from '@/components/vendor/ProfileSidebar'

function resolveVendorTypeLabel(vendorType: string): string {
  const labels: Record<string, string> = {
    freelance: 'Prestataire',
    lieu: 'Lieu de réception',
    traiteur: 'Traiteur',
    createurs: 'Créateur·rice',
  }
  return labels[vendorType] ?? vendorType
}

export default async function ProfileHubPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) redirect('/login')

  const { saved } = await searchParams

  const s = dashboard.sections_status

  const bookingSubtitle = s.booking_blocker
    ? `${dashboard.booking_blockers_count} jour${dashboard.booking_blockers_count > 1 ? 's' : ''} bloqué${dashboard.booking_blockers_count > 1 ? 's' : ''}`
    : 'Aucune indisponibilité renseignée'

  const portfolioSubtitle = s.portfolio
    ? `${dashboard.portfolio_photos_count} photo${dashboard.portfolio_photos_count > 1 ? 's' : ''} importée${dashboard.portfolio_photos_count > 1 ? 's' : ''}${dashboard.portfolio_has_cover ? ' · couverture désignée' : ''}`
    : 'Aucune photo importée'

  const matchingSections: Section[] = [
    {
      key: 'pricing_zone',
      label: 'Tarifs & Localisation',
      href: '/dashboard/profile/pricing-zone',
      completed: s.pricing_zone,
      subtitle: s.pricing_zone ? 'Tarifs et zones renseignés' : 'Indiquez votre zone d\'intervention',
    },
    {
      key: 'booking_blocker',
      label: 'Disponibilités',
      href: '/dashboard/profile/booking-blocker',
      completed: s.booking_blocker,
      subtitle: bookingSubtitle,
    },
    {
      key: 'experiences',
      label: 'Vos expériences de mariage',
      href: '/dashboard/profile/experiences',
      completed: s.experiences,
      disabled: dashboard.consent_granted === false,
      subtitle: dashboard.consent_granted === false
        ? 'Activez le matching culturel pour configurer cette section'
        : s.experiences
          ? 'Expériences renseignées'
          : 'Partagez les mariages marquants de votre parcours',
      tip: dashboard.consent_granted === false
        ? undefined
        : s.experiences
          ? undefined
          : 'Optionnel mais recommandé — renseigner vos expériences culturelles améliore la précision du matching. Sans elles, votre profil reste visible et éligible.',
    },
    {
      key: 'matching_consent',
      label: 'Confidentialité du matching',
      href: '/dashboard/profile/matching-consent',
      completed: s.matching_consent,
      subtitle: dashboard.consent_granted === true
        ? 'Matching culturel activé'
        : dashboard.consent_granted === false
          ? 'Matching culturel désactivé'
          : 'À compléter',
    },
  ]

  if (dashboard.vendorType === 'lieu') {
    matchingSections.push({
      key: 'venue_characteristics',
      label: 'Caractéristiques du lieu',
      href: '/dashboard/profile/venue-characteristics',
      completed: false,
      subtitle: 'Décrivez votre lieu',
    })
  }

  if (dashboard.vendorType === 'traiteur') {
    matchingSections.push({
      key: 'catering_characteristics',
      label: 'Caractéristiques traiteur',
      href: '/dashboard/profile/catering-characteristics',
      completed: false,
      subtitle: 'Décrivez votre offre traiteur',
    })
  }

  const groups: SectionGroup[] = [
    {
      id: 'identite',
      label: 'Identité & Métier',
      tabLabel: 'Identité',
      sections: [
        {
          key: 'general_info',
          label: 'Informations générales',
          href: '/dashboard/profile/general-info',
          completed: s.general_info,
          subtitle: s.general_info ? 'Nom, logo et catégorie · à jour' : 'Complétez vos informations de base',
        },
      ],
    },
    {
      id: 'matching',
      label: 'Matching',
      tabLabel: 'Matching',
      sections: matchingSections,
    },
    {
      id: 'vitrine',
      label: 'Ma vitrine',
      tabLabel: 'Vitrine',
      sections: [
        {
          key: 'portfolio',
          label: 'Portfolio',
          href: '/dashboard/profile/portfolio',
          completed: s.portfolio,
          subtitle: portfolioSubtitle,
        },
        {
          key: 'bio',
          label: 'Bio',
          href: '/dashboard/profile/bio',
          completed: s.bio,
          subtitle: s.bio ? 'Votre bio est à jour' : 'Votre bio n\'est pas encore renseignée',
          tip: s.bio
            ? undefined
            : 'Une bio complète rassure les couples hésitants — elle peut faire la différence.',
        },
      ],
    },
  ]

  const allSections = groups.flatMap((g) => g.sections)
  const completedCount = allSections.filter((sec) => sec.completed).length
  const toEnrichCount = allSections.length - completedCount

  const vendorTypeLabel = resolveVendorTypeLabel(dashboard.vendorType)

  return (
    <div className="bg-creme min-h-screen">
      {/* Hero */}
      <section className="bg-bordeaux text-creme px-5 pt-8 pb-10 md:px-[72px] md:pt-14 md:pb-16 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-52 h-52 md:-right-30 md:-top-30 md:w-90 md:h-90 rounded-full border border-creme/10 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-32 h-32 md:-right-15 md:-top-15 md:w-60 md:h-60 rounded-full border border-creme/[0.06] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative">
          <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-creme/40 mb-3 md:mb-4">
            Mon Profil
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-cormorant text-[36px] md:text-[52px] font-light leading-tight text-creme">
              Votre espace,{' '}
              <em className="italic text-dore">{dashboard.firstName}.</em>
            </h1>
            <div className="shrink-0 flex flex-col items-end gap-2 pb-1">
              <p className="font-manrope text-[12px] text-creme/50">{vendorTypeLabel}</p>
              <a
                href="#"
                className="font-manrope text-[12px] font-semibold text-creme/70 hover:text-creme transition-colors whitespace-nowrap"
              >
                Mon profil →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Status banner */}
      <div className="border-b border-bordeaux/[0.08] px-5 md:px-[72px] py-3 flex items-center justify-between gap-4">
        <p className="font-manrope text-[13px] text-texte flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-highlight shrink-0" />
          <span>
            Votre profil est visible -{' '}
            <strong className="font-semibold"> {toEnrichCount} section{toEnrichCount > 1 ? 's' : ''}</strong>{' '}
            {toEnrichCount > 1 ? 'peuvent' : 'peut'} encore vous démarquer.
          </span>
        </p>
        <p className="font-manrope text-[13px] font-semibold text-accent shrink-0">
          {completedCount} complétée{completedCount > 1 ? 's' : ''} · {toEnrichCount} à enrichir
        </p>
      </div>

      <ProfileHubClient groups={groups} sidebar={<ProfileSidebar />} savedKey={saved} />
    </div>
  )
}
