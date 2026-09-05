'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import { Toast } from '@/components/ui/Toast'
import {
  WedreamJourneyPreview,
  type JourneyPhase,
} from '@/components/wedream/WedreamJourneyPreview'
import { useToast } from '@/hooks/useToast'
import { apiFetch } from '@/lib/fetchClient'
import type { VendorProviderLead } from '@/lib/vendor'
import { formatWeddingDate, leadStatusLabel } from '@/lib/vendor-leads'
import {
  GALLERY_CELL_COUNT,
  JOURNEY_PLACEHOLDER_BG,
  JOURNEY_STYLE_GRADIENT,
  JOURNEY_TRADE_CIRCLE_BG,
  pickWedreamPhotos,
  resolvePrimaryTagLabel,
  resolveVendorTrade,
  type VendorTrade,
} from '@/lib/wedream-journey'

interface WedreamVisibilityClientProps {
  wedreamEnabled: boolean
  vendorServices: string[]
  portfolioPhotos: PortfolioImage[]
  /** Déjà triées par le backend, plus récente d'abord. */
  leads: VendorProviderLead[]
}

/**
 * Contenu purement décoratif de l'aperçu flouté affiché quand la visibilité est
 * désactivée : aucune donnée réelle n'existe côté backend avant les tickets 8-10.
 */
const TEASER_CARDS = [
  { names: 'Camille & Julien', date: '14 juin 2027', badge: true },
  { names: 'Léa & Thomas', date: '3 mai 2027', badge: true },
  { names: 'Manon & Antoine', date: '22 septembre 2026', badge: true },
  { names: 'Chloé & Hugo', date: '10 août 2027' },
  { names: 'Inès & Nicolas', date: '18 avril 2027' },
  { names: 'Sarah & Maxime', date: '2 juillet 2026' },
  { names: 'Emma & Baptiste', date: '27 mai 2027' },
  { names: 'Louise & Gabriel', date: '14 février 2027' },
]

function DateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <rect x="4" y="6" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 11h20" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 3v5M19 3v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[20px] shadow-[0_12px_32px_rgba(41,26,16,0.08)] px-6 py-9 md:px-14 md:py-12">
      {children}
    </section>
  )
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-cormorant font-medium text-[24px] tracking-[-0.01em] text-bordeaux mb-1.5">
      {children}
    </h2>
  )
}

function RequestGrid() {
  return (
    <div className="mt-2 grid gap-[22px] grid-cols-[repeat(auto-fill,minmax(232px,1fr))]">
      {TEASER_CARDS.map((card) => (
        <div
          key={card.names}
          className="block rounded-md overflow-hidden bg-white border border-bordeaux/10"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {card.badge && (
              <span className="absolute top-3 left-3 z-[2] bg-highlight text-creme text-[10px] font-semibold tracking-[0.14em] uppercase px-2.5 py-[5px] rounded-full">
                Nouveau
              </span>
            )}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-bordeaux) 8%, transparent) 0 10px, color-mix(in srgb, var(--color-bordeaux) 3%, transparent) 10px 20px)',
              }}
            >
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-texte/40">
                Coup de cœur
              </span>
            </div>
          </div>

          <div className="px-[18px] pt-4 pb-[18px]">
            <div className="font-cormorant font-medium text-[21px] tracking-[-0.01em] text-texte mb-[5px]">
              {card.names}
            </div>
            <div className="flex items-center gap-1.5 text-[12.5px] text-texte/55">
              <DateIcon />
              {card.date}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Les deux anneaux de la maquette : l'un neutre, l'autre en highlight. */
function RingsIcon() {
  return (
    <div className="relative w-16 h-10 mb-6" aria-hidden="true">
      <span className="absolute left-0 top-0 w-[38px] h-[38px] rounded-full border-[1.5px] border-bordeaux/20" />
      <span className="absolute right-0 top-0 w-[38px] h-[38px] rounded-full border-[1.5px] border-highlight" />
    </div>
  )
}

/** État « vide » : WedDream est activé, aucune demande n'est encore arrivée. */
function EmptyRequestsState() {
  return (
    <section className="bg-white rounded-[13px] border border-bordeaux/10 px-6 py-14 md:px-12 md:py-20 flex flex-col items-center text-center">
      <RingsIcon />

      <p className="font-cormorant italic font-light text-[22px] leading-[1.5] text-texte max-w-[460px]">
        Pas encore de demande — c&apos;est le calme avant les couples. Ça ne tarde jamais
        longtemps.
      </p>
    </section>
  )
}

const BADGE_BASE =
  'inline-flex items-center px-[13px] py-[5px] rounded-full text-[10px] font-bold tracking-[0.1em] uppercase'

function badgeClasses(label: string): string {
  if (label === 'Nouveau') return `${BADGE_BASE} bg-accent text-creme`
  if (label === 'Accepté') return `${BADGE_BASE} bg-white text-bordeaux border border-bordeaux`
  return `${BADGE_BASE} bg-gris text-creme`
}

/**
 * Une demande dans la liste. La catégorie et les tags ne sont pas sur la carte
 * de la maquette, mais le ticket les demande à ce niveau : ils tiennent sur une
 * ligne discrète sous la date, plutôt que d'obliger à ouvrir chaque fiche pour
 * savoir de quoi la demande parle.
 */
function LeadCard({ lead }: { lead: VendorProviderLead }) {
  const statusLabel = leadStatusLabel(lead.status)
  const weddingDate = formatWeddingDate(lead.weddingDate)
  const subtitle = [lead.category, ...lead.specialtyTags].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/dashboard/wedream/leads/${lead.id}`}
      className="block no-underline bg-white border border-bordeaux/10 rounded-[13px] overflow-hidden transition-colors hover:bg-bordeaux/[0.05]"
    >
      <div className="relative h-[180px] bg-gris">
        {lead.photoUrl ? (
          <Image
            src={lead.photoUrl}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 400px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: JOURNEY_PLACEHOLDER_BG }}
          >
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-texte/40">
              Coup de cœur
            </span>
          </div>
        )}

        <span className={`${badgeClasses(statusLabel)} absolute top-3 left-3 z-[2]`}>
          {statusLabel}
        </span>
      </div>

      <div className="bg-creme px-5 pt-[18px] pb-5">
        <div className="font-cormorant font-medium text-[22px] tracking-[-0.005em] text-texte">
          {lead.firstName}
        </div>

        {weddingDate && (
          <div className="flex items-center gap-[7px] mt-2 text-[12px] text-texte/55">
            <DateIcon />
            {weddingDate}
          </div>
        )}

        {subtitle && (
          <div className="mt-2 text-[11.5px] leading-[1.5] text-texte/45">{subtitle}</div>
        )}
      </div>
    </Link>
  )
}

/** État « default » : au moins une demande. Aucun tri ni filtre — l'ordre vient du backend. */
function LeadsList({ leads }: { leads: VendorProviderLead[] }) {
  return (
    <section>
      <h2 className="font-cormorant font-medium text-[24px] tracking-[-0.01em] text-texte mb-7">
        Vos demandes de mise en relation.
      </h2>

      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </section>
  )
}

function FilledHeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path
        d="M13 21.5s-9-5.6-9-12.2C4 5.9 6.4 4 9 4c1.8 0 3.3 1 4 2.4C13.7 5 15.2 4 17 4c2.6 0 5 1.9 5 5.3 0 6.6-9 12.2-9 12.2z"
        fill="var(--color-highlight)"
      />
    </svg>
  )
}

function SlideSublabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-texte/55">
      {children}
    </span>
  )
}

function LegendStrong({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold text-bordeaux">{children}</strong>
}

/** Phase 1 — le métier réel du prestataire. */
function JourneyTradeSlide({ trade }: { trade: VendorTrade }) {
  const TradeIcon = trade.icon

  return (
    <>
      <div
        className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center"
        style={{
          background: JOURNEY_TRADE_CIRCLE_BG,
          boxShadow: '0 0 0 10px color-mix(in srgb, var(--color-accent) 12%, transparent)',
        }}
      >
        <TradeIcon size={26} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
      </div>

      <span className="font-cormorant italic font-medium text-[14px] text-bordeaux">
        {trade.label}
      </span>

      <SlideSublabel>votre métier</SlideSublabel>
    </>
  )
}

/** Phase 2 — le tag de style mis en avant, sur la carte dégradée de la maquette. */
function JourneyStyleSlide({ label }: { label: string }) {
  return (
    <>
      <div
        className="w-[78px] h-24 rounded-md flex items-end justify-center pb-2 shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
        style={{ background: JOURNEY_STYLE_GRADIENT }}
      >
        <span className="font-cormorant font-light text-[12px] text-white">{label}</span>
      </div>

      <SlideSublabel>votre style</SlideSublabel>
    </>
  )
}

/** Phase 3 — les vraies photos WedDream, cases restantes en placeholder rayé. */
function JourneyGallerySlide({ photos }: { photos: PortfolioImage[] }) {
  // Le cœur pulse sur une case qui porte une vraie photo : la 2e dès qu'elle existe,
  // pour reproduire le décalage de la maquette sans viser une case vide. À 0 photo,
  // -1 ne correspond à aucun index : aucune case grisée ne reçoit le cœur.
  const highlightIndex = photos.length === 0 ? -1 : photos.length > 1 ? 1 : 0

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: GALLERY_CELL_COUNT }, (_, index) => {
        const photo = photos[index]
        const highlighted = index === highlightIndex

        return (
          <div
            key={photo?.id ?? `empty-${index}`}
            className={[
              'relative w-[58px] aspect-[4/3] rounded-[5px] overflow-hidden',
              highlighted
                ? 'shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_35%,transparent),0_0_14px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]'
                : '',
            ].join(' ')}
            style={photo ? undefined : { background: JOURNEY_PLACEHOLDER_BG }}
          >
            {photo && (
              <Image src={photo.url} alt="" fill sizes="58px" className="object-cover" />
            )}

            {highlighted && (
              <span className="wedream-heart-pop absolute top-1/2 left-1/2">
                <FilledHeartIcon />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function WedreamVisibilityClient({
  wedreamEnabled,
  vendorServices,
  portfolioPhotos,
  leads,
}: WedreamVisibilityClientProps) {
  const [enabled, setEnabled] = useState(wedreamEnabled)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast, showToast } = useToast()

  const journeyPhases = useMemo<JourneyPhase[]>(() => {
    const trade = resolveVendorTrade(vendorServices)
    const styleLabel = resolvePrimaryTagLabel(portfolioPhotos)
    const galleryPhotos = pickWedreamPhotos(portfolioPhotos, GALLERY_CELL_COUNT)

    const phases: JourneyPhase[] = []

    // Une phase sans donnée réelle n'est pas rendue vide : elle est simplement
    // absente du tableau, l'orchestrateur boucle sur ce qui reste.
    if (trade) {
      phases.push({
        key: 'trade',
        content: <JourneyTradeSlide trade={trade} />,
        legend: <>Son métier : <LegendStrong>{trade.label}</LegendStrong></>,
      })
    }

    if (styleLabel) {
      phases.push({
        key: 'style',
        content: <JourneyStyleSlide label={styleLabel} />,
        legend: <>Son style : <LegendStrong>{styleLabel}</LegendStrong></>,
      })
    }

    // La phase galerie est toujours présente, même sans aucune photo publiée : les
    // 4 cases retombent sur le placeholder grisé et la boucle continue de tourner
    // au lieu de se figer sur la seule phase restante.
    phases.push({
      key: 'gallery',
      content: <JourneyGallerySlide photos={galleryPhotos} />,
      legend: <><LegendStrong>Vos photos</LegendStrong>, découvertes en vrai</>,
    })

    return phases
  }, [vendorServices, portfolioPhotos])

  // L'aperçu « Comment un couple vous découvre » s'efface dès qu'il y a de vraies
  // demandes à lire : c'est la condition que WED-121 avait laissée en TODO faute de
  // cette donnée côté client, elle arrive avec la liste des leads (WED-52).
  const hasLeads = leads.length > 0
  const showJourney = enabled && journeyPhases.length > 0 && !hasLeads

  // TODO(WED-1XX) : ajouter une modal de confirmation ici, mais seulement si des demandes
  // de mise en relation sont en cours — dépend des tickets 8-10 (leads Wedream prestataire),
  // pas encore livrés. Décision consciente : MVP sans ce garde-fou.
  async function toggleVisibility() {
    const next = !enabled
    setSubmitting(true)
    try {
      await apiFetch('/api/vendors/me/wedream-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      setEnabled(next)
      showToast(
        'success',
        next
          ? 'Votre univers est désormais visible dans WedDream ✓'
          : 'Votre visibilité WedDream est désactivée. Vos photos et vos tags sont conservés.'
      )
      router.refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-manrope">
      <Toast toast={toast} />

      {/* ── Bandeau de titre ───────────────────────────────────────────── */}
      <header className="bg-bordeaux px-6 md:px-[72px] pt-12 md:pt-[52px] pb-10 md:pb-11">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-creme/60 mb-3.5">
          WedDream
        </p>
        <h1 className="font-cormorant text-[30px] md:text-[40px] leading-[1.12] tracking-[-0.01em] text-creme">
          Vos demandes <em className="italic text-dore">de mise en relation.</em>
        </h1>
      </header>

      <div className="px-6 md:px-[72px] pt-10 md:pt-11 pb-24 flex flex-col gap-7">
        {/* ── Activation ───────────────────────────────────────────────── */}
        <CardPanel>
          <PanelTitle>Partagez votre univers dans WedDream</PanelTitle>

          <p className="text-[15px] leading-[1.7] text-texte/55 max-w-[640px] mt-3.5 mb-7">
            Ils tombent sous le charme avant même de vous écrire. WedDream présente votre
            univers dans une galerie inspirationnelle, et les couples vous contactent quand
            le coup de cœur est là.
          </p>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={toggleVisibility}
            disabled={submitting}
            className="inline-flex items-center gap-3.5 px-[22px] py-[13px] rounded-full border-[1.5px] border-accent bg-transparent hover:bg-accent/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={[
                'relative w-[38px] h-6 rounded-full shrink-0 transition-colors',
                enabled ? 'bg-accent' : 'bg-bordeaux/[0.18]',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
                  enabled ? 'translate-x-[14px]' : 'translate-x-0',
                ].join(' ')}
              />
            </span>

            <span className="text-[13.5px] font-bold tracking-[0.02em] text-accent">
              {submitting ? 'Enregistrement…' : enabled ? 'Désactiver WedDream' : 'Activer WedDream'}
            </span>
          </button>
        </CardPanel>

        {/* ── Demandes ─────────────────────────────────────────────────── */}
        {/* Maquette « Activé — vide » : la preview prend la colonne large (60 %) et
            le panneau des demandes passe à droite. Sous 900 px, tout repasse en une
            colonne avec la preview au-dessus. */}
        <div
          className={
            showJourney ? 'grid gap-5 items-stretch min-[900px]:grid-cols-[60%_40%]' : undefined
          }
        >
          {showJourney && (
            <WedreamJourneyPreview
              phases={journeyPhases}
              title="Comment un couple vous découvre"
              badgeLabel="Aperçu"
            />
          )}

          {/* Trois états, un seul écran (maquette « Section Wedream - 3 states ») :
              WedDream désactivé → aperçu flouté ; activé sans demande → état vide ;
              activé avec des demandes → la liste. */}
          {!enabled ? (
            <CardPanel>
              <PanelTitle>Vos demandes de mise en relation</PanelTitle>

              <div className="relative mt-2">
                <div className="absolute inset-0 z-[2] rounded-lg bg-creme/60 pointer-events-none" />
                <div
                  className="filter grayscale blur-[3px] pointer-events-none select-none"
                  aria-hidden="true"
                >
                  <RequestGrid />
                </div>
              </div>
            </CardPanel>
          ) : hasLeads ? (
            <LeadsList leads={leads} />
          ) : (
            <EmptyRequestsState />
          )}
        </div>
      </div>
    </div>
  )
}
