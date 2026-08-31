import Link from 'next/link'
import {
  formatRequestedAt,
  formatSlug,
  fullPriceRange,
  vendorTypeLabel,
  type UnlockedLead,
} from '@/lib/couple-leads'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-manrope text-[10px] uppercase tracking-[0.2em] text-bordeaux/50">
      <span className="h-px w-6 flex-shrink-0 bg-bordeaux/30" />
      {children}
    </p>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((slug) => (
        <span
          key={slug}
          className="rounded-full border border-bordeaux/25 px-4 py-1.5 font-manrope text-[12px] text-bordeaux"
        >
          {formatSlug(slug)}
        </span>
      ))}
    </div>
  )
}

/**
 * Écran 4 — fiche prestataire dévoilée. Rendu uniquement pour une demande
 * `DEBLOQUEE` : le bloc `vendor` et les coordonnées ne transitent que dans cette
 * forme du DTO (PROVIDER-LEAD-005). Aucun masquage n'est fait ici.
 */
export function UnlockedVendorSheet({ lead }: { lead: UnlockedLead }) {
  const { vendor } = lead
  const { contact } = vendor
  const requestedAt = formatRequestedAt(lead.requestedAt)
  const priceRange = fullPriceRange(vendor)
  const cityLine = [contact.zipcode, contact.city].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/mon-espace/demandes"
        className="inline-flex w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris no-underline transition-colors hover:text-texte"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19 12H5M5 12L11 6M5 12L11 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Retour aux demandes
      </Link>

      <section className="overflow-hidden rounded-3xl border border-bordeaux/10 bg-white">
        <div className="relative h-[240px] bg-bordeaux md:h-[320px]">
          {lead.photoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, cohérent avec la galerie WedDream. */
            <img
              src={lead.photoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bordeaux/90 via-bordeaux/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <p className="mb-1.5 font-manrope text-[10px] uppercase tracking-[0.18em] text-creme/60">
              {lead.category ?? vendorTypeLabel(vendor.vendorType)}
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-highlight px-2 py-0.5 text-[9px] tracking-[0.12em] text-white">
                <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
                Débloquée
              </span>
            </p>
            <h1 className="font-cormorant text-[36px] font-light leading-none text-creme md:text-[56px]">
              {vendor.brandName}
            </h1>
            {requestedAt && (
              <p className="mt-2 font-manrope text-[11px] text-creme/60">{requestedAt}</p>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-[680px] flex-col gap-9 px-5 py-8 md:px-8 md:py-12">
          {vendor.bio && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Sa voix</SectionLabel>
              <blockquote className="relative pl-7">
                <span
                  className="absolute left-0 top-0 select-none font-cormorant text-[48px] leading-none text-accent/25"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="pt-6 font-cormorant text-[18px] italic leading-[1.7] text-texte md:text-[22px]">
                  {vendor.bio}
                </p>
              </blockquote>
            </section>
          )}

          {vendor.description && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Sa présentation</SectionLabel>
              <p className="whitespace-pre-line font-manrope text-[14px] leading-[1.8] text-texte/85">
                {vendor.description}
              </p>
            </section>
          )}

          {vendor.styles.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Son style</SectionLabel>
              <Chips items={vendor.styles} />
            </section>
          )}

          {vendor.services.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Ses prestations</SectionLabel>
              <Chips items={vendor.services} />
            </section>
          )}

          {priceRange && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Ses tarifs</SectionLabel>
              <p className="font-cormorant text-[20px] font-medium text-accent">{priceRange}</p>
            </section>
          )}

          {vendor.portfolio.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionLabel>Portfolio</SectionLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {vendor.portfolio.map((url) => (
                  /* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, cohérent avec la galerie WedDream. */
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-4 rounded-2xl border border-bordeaux/10 bg-creme p-5 md:p-6">
            <SectionLabel>Ses coordonnées</SectionLabel>
            <dl className="flex flex-col gap-3 font-manrope text-[14px] text-texte">
              {contact.email && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-gris">E-mail</dt>
                  <dd>
                    <a href={`mailto:${contact.email}`} className="text-accent no-underline hover:underline">
                      {contact.email}
                    </a>
                  </dd>
                </div>
              )}
              {contact.phone && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-gris">Téléphone</dt>
                  <dd>
                    <a href={`tel:${contact.phone}`} className="text-accent no-underline hover:underline">
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              )}
              {(contact.address || cityLine) && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-gris">Adresse</dt>
                  <dd>
                    {contact.address && <span className="block">{contact.address}</span>}
                    {cityLine && <span className="block">{cityLine}</span>}
                  </dd>
                </div>
              )}
              {!contact.email && !contact.phone && !contact.address && !cityLine && (
                <p className="text-[13px] text-gris">
                  Le prestataire n’a pas encore renseigné ses coordonnées.
                </p>
              )}
            </dl>
          </section>
        </div>
      </section>
    </div>
  )
}
