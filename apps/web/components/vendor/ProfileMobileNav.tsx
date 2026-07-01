import Link from 'next/link'
import { fetchVendorDashboard } from '@/lib/vendor'

type NavItem = { label: string; href: string; completed: boolean }

export default async function ProfileMobileNav() {
  const dashboard = await fetchVendorDashboard()
  if (!dashboard) return null

  const s = dashboard.sections_status

  const items: NavItem[] = [
    { label: 'Infos générales', href: '/dashboard/profile/general-info', completed: s.general_info },
    { label: 'Tarifs & Zone', href: '/dashboard/profile/pricing-zone', completed: s.pricing_zone },
    { label: 'Disponibilités', href: '/dashboard/profile/booking-blocker', completed: s.booking_blocker },
    { label: 'Expériences', href: '/dashboard/profile/experiences', completed: s.experiences },
    { label: 'Matching culturel', href: '/dashboard/profile/matching-consent', completed: s.matching_consent },
    { label: 'Portfolio', href: '/dashboard/profile/portfolio', completed: s.portfolio },
    { label: 'Bio', href: '/dashboard/profile/bio', completed: s.bio },
  ]

  if (dashboard.vendorType === 'lieu') {
    items.splice(4, 0, { label: 'Lieu', href: '/dashboard/profile/venue-characteristics', completed: false })
  }
  if (dashboard.vendorType === 'traiteur') {
    items.splice(4, 0, { label: 'Traiteur', href: '/dashboard/profile/catering-characteristics', completed: false })
  }

  return (
    <div
      className="md:hidden flex overflow-x-auto border-b border-bordeaux/[0.08] bg-creme"
      style={{ scrollbarWidth: 'none' }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="shrink-0 flex items-center gap-1.5 px-4 py-3 font-manrope text-[13px] text-gris whitespace-nowrap hover:text-texte transition-colors"
        >
          {item.completed ? (
            <svg className="shrink-0 text-accent/70" width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-highlight" />
          )}
          {item.label}
        </Link>
      ))}
    </div>
  )
}
