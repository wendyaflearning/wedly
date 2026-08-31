import Link from 'next/link'
import {
  formatLeadDate,
  portfolioLinkLabel,
  priceAmountRange,
  priceTypeLabel,
  unlockedProgressLabel,
  vendorTypeLabel,
  type StatusCounts,
  type UnlockedLead,
} from '@/lib/couple-leads'

/** Nombre de vignettes du portfolio montrées sur la fiche — la galerie complète vit sur `/photos`. */
const PORTFOLIO_PREVIEW_COUNT = 4

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 block font-manrope text-[10px] font-semibold uppercase tracking-[0.16em] text-bordeaux">
      {children}
    </span>
  )
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4c.9 0 2.6 3 2.6 3.9 0 .9-1.5 1.5-1.5 2.6 0 1.8 3.4 5.2 5.2 5.2 1.1 0 1.7-1.5 2.6-1.5.9 0 3.9 1.7 3.9 2.6 0 1.5-2.1 3-3.6 3C11.9 19.8 4.2 12.1 4.2 7.6 4.2 6.1 5.7 4 6 4z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 7.5l9 6.5 9-6.5" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  )
}

/** Une ligne de coordonnée : icône, libellé, valeur, et son action à droite quand elle en a une. */
function ContactRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-bordeaux/10 py-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-bordeaux">{icon}</span>
        <div className="min-w-0">
          <span className="block font-manrope text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gris">
            {label}
          </span>
          <span className="mt-0.5 block break-words font-manrope text-[14px] text-texte">{value}</span>
        </div>
      </div>
      {action && (
        <a
          href={action.href}
          className="shrink-0 font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-highlight no-underline hover:underline"
        >
          {action.label} →
        </a>
      )}
    </div>
  )
}

/**
 * Écran 4 — fiche prestataire dévoilée. Rendu uniquement pour une demande
 * `DEBLOQUEE` : le bloc `vendor` et les coordonnées ne transitent que dans cette
 * forme du DTO (PROVIDER-LEAD-005). Aucun masquage n'est fait ici.
 *
 * Structure arbitrée par Wendy le 31/08 sur WED-134 : bandeau bordeaux plein
 * (pas de photo), deux colonnes, coordonnées en tête, portfolio à droite. Le
 * SIRET et les disponibilités de la maquette sont retirés — l'API ne les expose
 * pas au couple — et la voix du prestataire prend la place des disponibilités.
 */
export function UnlockedVendorSheet({
  lead,
  counts,
}: {
  lead: UnlockedLead
  counts: StatusCounts
}) {
  const { vendor } = lead
  const { contact } = vendor

  const trade = lead.category ?? vendorTypeLabel(vendor.vendorType)
  const requestedOn = formatLeadDate(lead.requestedAt)
  const progress = unlockedProgressLabel(counts)
  const amount = priceAmountRange(vendor)
  const priceLabel = priceTypeLabel(vendor.priceType)
  const zones = lead.zones.join(' · ')
  const photosLabel = portfolioLinkLabel(vendor.portfolio.length)
  const hasContact = Boolean(contact.phone || contact.email || zones)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/mon-espace/demandes"
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
        Retour aux demandes
      </Link>

      <section className="overflow-hidden rounded-3xl border border-bordeaux/10 bg-creme">
        <div className="flex flex-col gap-4 bg-bordeaux px-5 py-6 md:flex-row md:items-start md:justify-between md:px-14 md:py-7">
          <div>
            {progress && (
              <span className="block font-manrope text-[10px] font-medium uppercase tracking-[0.22em] text-dore">
                Dossier prestataire · {progress}
              </span>
            )}
            <h1 className="mt-3 mb-2 font-cormorant text-[26px] font-light leading-[1.15] text-creme md:text-[32px]">
              {vendor.brandName}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-manrope text-[13px] text-creme/65">{trade}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-creme/35" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E35704] to-[#F58324] px-[11px] py-[5px] font-manrope text-[9.5px] font-medium uppercase tracking-[0.1em] text-creme">
                <span className="h-[5px] w-[5px] rounded-full bg-creme" aria-hidden="true" />
                Débloquée
              </span>
            </div>
          </div>

          {requestedOn && (
            <div className="md:text-right">
              <span className="block font-cormorant text-[13px] italic text-creme/45">
                Demande envoyée
              </span>
              <span className="mt-0.5 block font-manrope text-[13px] text-creme">{requestedOn}</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-12 md:px-14 md:pb-16">
          <div className="mt-8 flex flex-col gap-10 md:grid md:grid-cols-[1.6fr_1fr] md:gap-11">
            <div>
              {hasContact ? (
                <>
                  {contact.phone && (
                    <ContactRow
                      icon={<PhoneIcon />}
                      label="Téléphone"
                      value={contact.phone}
                      action={{ href: `tel:${contact.phone.replace(/\s/g, '')}`, label: 'Appeler' }}
                    />
                  )}
                  {contact.email && (
                    <ContactRow
                      icon={<MailIcon />}
                      label="E-mail"
                      value={contact.email}
                      action={{ href: `mailto:${contact.email}`, label: 'Écrire' }}
                    />
                  )}
                  {zones && <ContactRow icon={<PinIcon />} label="Zone d'intervention" value={zones} />}
                </>
              ) : (
                <p className="border-b border-bordeaux/10 py-[18px] font-manrope text-[13px] text-gris">
                  Le prestataire n&rsquo;a pas encore renseigné ses coordonnées.
                </p>
              )}

              {amount && (
                <div className="mt-8">
                  <SectionLabel>Tarifs</SectionLabel>
                  <div className="overflow-hidden rounded-[14px] bg-bordeaux/5">
                    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <span className="font-manrope text-[13px] text-texte">
                        {priceLabel ? `Tarif ${priceLabel}` : 'Tarif indicatif'}
                      </span>
                      <span className="shrink-0 font-cormorant text-[17px] italic text-bordeaux">
                        {amount}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {vendor.bio && (
                <div className="mt-7">
                  <SectionLabel>Sa voix</SectionLabel>
                  <blockquote className="relative pl-7">
                    <span
                      className="absolute left-0 top-0 select-none font-cormorant text-[48px] leading-none text-accent/25"
                      aria-hidden="true"
                    >
                      &ldquo;
                    </span>
                    <p className="pt-6 font-cormorant text-[16px] italic leading-[1.7] text-texte md:text-[18px]">
                      {vendor.bio}
                    </p>
                  </blockquote>
                </div>
              )}
            </div>

            {vendor.portfolio.length > 0 && (
              <div>
                <SectionLabel>Portfolio</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-bordeaux/5 p-3">
                  {vendor.portfolio.slice(0, PORTFOLIO_PREVIEW_COUNT).map((url) => (
                    /* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, cohérent avec la galerie WedDream. */
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="aspect-square w-full rounded-xl bg-bordeaux/10 object-cover"
                    />
                  ))}
                </div>
                {photosLabel && (
                  <Link
                    href={`/mon-espace/demandes/${lead.id}/photos`}
                    className="mt-3 block font-manrope text-[11.5px] font-semibold tracking-[0.06em] text-highlight no-underline hover:underline"
                  >
                    {photosLabel} →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
