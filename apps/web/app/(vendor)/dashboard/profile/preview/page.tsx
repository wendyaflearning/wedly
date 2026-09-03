import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fetchVendorPreview } from '@/lib/vendor'
import IncompleteBadge from './_components/IncompleteBadge'
import PublishButton from './_components/PublishButton'

const VENDOR_TYPE_LABELS: Record<string, string> = {
  freelance: 'Prestataire',
  lieu: 'Lieu de réception',
  traiteur: 'Traiteur',
  createurs: 'Créateur·rice',
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_service: 'par prestation',
  per_person: 'par personne',
  per_hour: 'par heure',
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatCentsNoSymbol(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatStyleSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-manrope text-[10px] tracking-[0.2em] uppercase text-bordeaux/50">
      <span className="w-6 h-px bg-bordeaux/30 flex-shrink-0" />
      {children}
    </p>
  )
}

export default async function VendorPreviewPage() {
  const preview = await fetchVendorPreview()
  if (!preview) redirect('/login')

  const vendorTypeLabel = VENDOR_TYPE_LABELS[preview.vendor_type] ?? preview.vendor_type
  const priceTypeLabel = PRICE_TYPE_LABELS[preview.price_type] ?? preview.price_type
  const { completion } = preview

  const sortedImages = [...preview.portfolio_images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1
    if (!a.is_cover && b.is_cover) return 1
    return a.sort_order - b.sort_order
  })

  const coverImage = sortedImages[0] ?? null
  const gridImages = sortedImages.slice(0, 5)

  return (
    <div>
      {/* Barre de contexte vendor */}
      <div className="border-b border-bordeaux/10 bg-creme px-4 md:px-[72px] py-3 md:py-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-manrope text-[11px] font-semibold tracking-[0.14em] uppercase text-bordeaux flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden sm:inline">Aperçu de votre profil public</span>
            <span className="sm:hidden">Aperçu</span>
          </p>
          <p className="hidden sm:block font-manrope text-[11px] text-gris mt-0.5">Vue couple · lecture seule</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/profile"
            className="font-manrope text-[11px] font-semibold tracking-[0.12em] uppercase text-bordeaux border border-bordeaux/30 px-3 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-bordeaux/5 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="hidden sm:inline">Modifier mon profil</span>
          </Link>
          <PublishButton completion={completion} isPublished={preview.is_published} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[260px] md:h-[400px] bg-bordeaux overflow-hidden">
        {coverImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverImage.url}
            alt="Photo de couverture"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bordeaux/90 via-bordeaux/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-[72px] pb-6 md:pb-12">
          <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-creme/50 mb-1.5">
            — {vendorTypeLabel}
          </p>
          <h1 className="font-cormorant text-[40px] md:text-[68px] font-light text-creme leading-none">
            {preview.brand_name}
          </h1>
        </div>
      </section>

      {/* Contenu */}
      <main className="max-w-[720px] mx-auto px-5 py-8 md:py-14 space-y-10 md:space-y-14">

        {/* SA VOIX */}
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <SectionLabel>Ta voix</SectionLabel>
            {!completion.bio && <IncompleteBadge href="/dashboard/profile/bio" />}
          </div>
          {preview.bio ? (
            <blockquote className="relative pl-7 md:pl-8">
              <span className="absolute left-0 top-0 font-cormorant text-[48px] md:text-[56px] text-accent/25 leading-none select-none" aria-hidden="true">
                &ldquo;
              </span>
              <p className="font-cormorant text-[18px] md:text-[22px] leading-[1.7] text-texte italic pt-6 md:pt-7">
                {preview.bio}
              </p>
            </blockquote>
          ) : (
            <p className="font-manrope text-[14px] text-gris italic">Bio non renseignée.</p>
          )}
        </section>

        {/* SON STYLE — affiché uniquement si des styles sont renseignés */}
        {preview.styles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <SectionLabel>Son style</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              {preview.styles.map((slug) => (
                <span
                  key={slug}
                  className="font-manrope text-[12px] border border-bordeaux/25 text-bordeaux px-4 py-1.5 rounded-full"
                >
                  {formatStyleSlug(slug)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* PORTFOLIO */}
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <SectionLabel>Portfolio</SectionLabel>
            {!completion.portfolio && <IncompleteBadge href="/dashboard/profile/portfolio" />}
          </div>
          {gridImages.length > 0 ? (
            <>
              {/* Mobile : grande image + 2x2 */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden md:hidden">
                {gridImages[0] && (
                  <div className="col-span-2 h-[200px] overflow-hidden bg-bordeaux/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gridImages[0].url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {gridImages.slice(1, 5).map((img) => (
                  <div key={img.id} className="h-[110px] overflow-hidden bg-bordeaux/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Desktop : asymétrique 2fr 1fr 1fr */}
              <div
                className="hidden md:grid gap-1.5 rounded-xl overflow-hidden"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  height: '360px',
                }}
              >
                {gridImages.map((img, i) => (
                  <div
                    key={img.id}
                    className={i === 0 ? 'overflow-hidden bg-bordeaux/10 row-span-2' : 'overflow-hidden bg-bordeaux/10'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 md:h-40 rounded-xl bg-bordeaux/5 flex items-center justify-center">
              <p className="font-manrope text-[13px] text-gris">Aucune photo importée.</p>
            </div>
          )}
        </section>

        {/* EN PRATIQUE */}
        <section>
          <div className="mb-5 md:mb-6">
            <SectionLabel>En pratique</SectionLabel>
          </div>
          <div className="space-y-6 md:space-y-7">

            {/* Disponibilités */}
            <div className="flex gap-3 md:gap-4">
              <div className="mt-0.5 shrink-0 text-bordeaux/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-bordeaux/40">Disponibilités</p>
                  {!completion.disponibilites && <IncompleteBadge href="/dashboard/profile/booking-blocker" />}
                </div>
                {preview.booking_blockers.length > 0 ? (
                  <p className="font-manrope text-[13px] md:text-[14px] text-texte">
                    {preview.booking_blockers.length} période{preview.booking_blockers.length > 1 ? 's' : ''} d&apos;indisponibilité renseignée{preview.booking_blockers.length > 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="font-manrope text-[13px] md:text-[14px] text-gris">Toutes dates disponibles</p>
                )}
              </div>
            </div>

            {/* Zone d'intervention */}
            <div className="flex gap-3 md:gap-4">
              <div className="mt-0.5 shrink-0 text-bordeaux/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-bordeaux/40">Zone d&apos;intervention</p>
                  {!completion.zone && <IncompleteBadge href="/dashboard/profile/pricing-zone" />}
                </div>
                {preview.zones.length > 0 ? (
                  <div className="space-y-0.5">
                    {preview.zones.map((zone) => (
                      <p key={zone.id} className="font-manrope text-[13px] md:text-[14px] text-texte">{zone.name}</p>
                    ))}
                  </div>
                ) : (
                  <p className="font-manrope text-[13px] md:text-[14px] text-gris">Zone non renseignée</p>
                )}
              </div>
            </div>

            {/* Tarifs */}
            <div className="flex gap-3 md:gap-4">
              <div className="mt-0.5 shrink-0 text-bordeaux/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 9a2 2 0 0 1 0-4V3h20v2a2 2 0 0 1 0 4v2a2 2 0 0 1 0 4v2H2v-2a2 2 0 0 1 0-4V9z" />
                  <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="2 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-bordeaux/40">Tarifs</p>
                  {!completion.tarifs && <IncompleteBadge href="/dashboard/profile/pricing-zone" />}
                </div>
                {completion.tarifs ? (
                  <>
                    <p className="font-cormorant text-[22px] md:text-[26px] text-texte leading-none">
                      {formatCentsNoSymbol(preview.price_min_cents)}
                      <span className="text-gris mx-2 text-[18px] md:text-[20px]">à</span>
                      {formatCents(preview.price_max_cents)}
                    </p>
                    <p className="font-manrope text-[11px] md:text-[12px] text-gris mt-1">
                      Fourchette indicative · {priceTypeLabel}
                    </p>
                  </>
                ) : (
                  <p className="font-manrope text-[13px] md:text-[14px] text-gris">Tarifs non renseignés</p>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* COORDONNÉES MASQUÉES */}
        <section className="bg-bordeaux rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-creme/40 shrink-0" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="font-manrope text-[10px] tracking-[0.18em] uppercase text-creme/40">
              Coordonnées masquées
            </p>
          </div>
          <p className="font-manrope text-[11px] md:text-[12px] text-creme/30 mb-5 md:mb-6">
            Visible uniquement après un match
          </p>
          <div>
            {[
              { label: 'Téléphone', value: '•• •• •• •• ••' },
              { label: 'E-mail', value: '••••@••••.fr' },
              { label: 'Siret', value: '••• ••• ••• •••••' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-t border-creme/10 py-3">
                <p className="font-manrope text-[10px] md:text-[11px] tracking-[0.1em] uppercase text-creme/35">{label}</p>
                <p className="font-manrope text-[12px] md:text-[13px] text-creme/20 select-none blur-[3px]">{value}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
