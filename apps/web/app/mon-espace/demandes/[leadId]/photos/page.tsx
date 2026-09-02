import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ContactRequestsError } from '@/components/couple/contact-requests/ContactRequestsError'
import { isUnlockedLead, vendorTypeLabel } from '@/lib/couple-leads'
import { fetchCoupleLeads } from '@/lib/couple-leads.server'

export const metadata: Metadata = {
  title: 'Portfolio | Mon espace Wedly',
  description: 'Toutes les photos du prestataire qui a accepté votre demande de contact.',
}

type PageProps = { params: Promise<{ leadId: string }> }

/**
 * Galerie complète du prestataire débloqué — la cible du lien « Voir les N photos »
 * de l'Écran 4, qui n'en avait aucune (aucune galerie par prestataire n'existe).
 *
 * Mêmes gardes et mêmes codes de redirection que la fiche : un lead verrouillé ne
 * doit pas dévoiler son portfolio par cette porte-là non plus.
 */
export default async function UnlockedVendorPhotosPage({ params }: PageProps) {
  const { leadId } = await params
  const result = await fetchCoupleLeads()

  if (!result.ok) return <ContactRequestsError />

  const lead = result.items.find((item) => item.id === leadId)

  if (!lead) redirect('/mon-espace/demandes?indisponible=introuvable')
  if (!isUnlockedLead(lead)) redirect('/mon-espace/demandes?indisponible=verrouillee')

  const { vendor } = lead
  const trade = lead.category ?? vendorTypeLabel(vendor.vendorType)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/mon-espace/demandes/${lead.id}`}
        className="inline-flex w-fit items-center gap-2 font-cormorant text-[15px] italic text-bordeaux no-underline transition-opacity hover:opacity-70"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M9 3L4 7l5 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Retour à la fiche
      </Link>

      <section className="overflow-hidden rounded-3xl border border-bordeaux/10 bg-creme px-5 py-8 md:px-14 md:py-10">
        <span className="block font-manrope text-[10px] font-semibold uppercase tracking-[0.16em] text-bordeaux">
          Portfolio · {trade}
        </span>
        <h1 className="mt-3 font-cormorant text-[26px] font-light leading-[1.15] text-texte md:text-[32px]">
          {vendor.brandName}
        </h1>

        {vendor.portfolio.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {vendor.portfolio.map((url) => (
              /* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, cohérent avec la galerie WedDream. */
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square w-full rounded-xl bg-bordeaux/10 object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 font-manrope text-[13px] text-gris">
            {vendor.brandName} n&rsquo;a pas encore publié de photos.
          </p>
        )}
      </section>
    </div>
  )
}
