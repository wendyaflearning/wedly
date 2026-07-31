import Link from 'next/link'
import { fetchVendorDashboard } from '@/lib/vendor'

type SidebarSection = {
  key: string
  label: string
  href: string
  completed: boolean
}

type SidebarGroup = {
  label: string
  sections: SidebarSection[]
}

function buildGroups(
  status: {
    general_info: boolean
    pricing_zone: boolean
    experiences: boolean
    matching_consent: boolean
    bio: boolean
    portfolio: boolean
    booking_blocker: boolean
  },
  vendorType: string,
): SidebarGroup[] {
  const matching: SidebarSection[] = [
    { key: 'pricing_zone', label: 'Tarifs & Localisation', href: '/dashboard/profile/pricing-zone', completed: status.pricing_zone },
    { key: 'booking_blocker', label: 'Disponibilités', href: '/dashboard/profile/booking-blocker', completed: status.booking_blocker },
    { key: 'experiences', label: 'Vos expériences de mariage', href: '/dashboard/profile/experiences', completed: status.experiences },
  ]

  if (vendorType === 'lieu') {
    matching.push({ key: 'venue', label: 'Caractéristiques du lieu', href: '/dashboard/profile/venue-characteristics', completed: false })
  }
  if (vendorType === 'traiteur') {
    matching.push({ key: 'catering', label: 'Caractéristiques traiteur', href: '/dashboard/profile/catering-characteristics', completed: false })
  }

  return [
    {
      label: 'Identité & Métier',
      sections: [
        { key: 'general_info', label: 'Informations générales', href: '/dashboard/profile/general-info', completed: status.general_info },
      ],
    },
    { label: 'Matching', sections: matching },
    {
      label: 'Ma vitrine',
      sections: [
        { key: 'portfolio', label: 'Portfolio', href: '/dashboard/profile/portfolio', completed: status.portfolio },
        { key: 'bio', label: 'Bio', href: '/dashboard/profile/bio', completed: status.bio },
      ],
    },
  ]
}

export default async function ProfileSidebar() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) return null

  const groups = buildGroups(dashboard.sections_status, dashboard.vendorType)

  return (
    <nav className="w-[220px] shrink-0">
      {groups.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? 'mt-7' : ''}>
          <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-texte/40 mb-1">
            {group.label}
          </p>
          {group.sections.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className="flex items-center gap-3 py-3 border-b border-bordeaux/[0.08] group"
            >
              {section.completed ? (
                <svg
                  className="shrink-0 text-accent/70"
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8l3.5 3.5L13 5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="shrink-0 w-2 h-2 rounded-full bg-highlight" />
              )}
              <span
                className={[
                  'font-manrope text-[13.5px] leading-snug transition-colors',
                  section.completed
                    ? 'text-texte/60 group-hover:text-texte/80'
                    : 'text-texte font-semibold group-hover:text-bordeaux',
                ].join(' ')}
              >
                {section.label}
              </span>
            </Link>
          ))}
        </div>
      ))}
      <div className="mt-8 pt-6 border-t border-bordeaux/[0.08]">
        <Link
          href="/dashboard/profile/preview"
          className="flex items-center gap-2 font-manrope text-[12px] font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Aperçu de mon profil
        </Link>
      </div>
    </nav>
  )
}
