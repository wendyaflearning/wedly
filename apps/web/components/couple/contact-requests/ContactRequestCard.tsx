import Link from 'next/link'
import {
  formatRequestedAt,
  isUnlockedLead,
  leadTooltipLines,
  STATUS_LABELS,
  type CoupleLead,
} from '@/lib/couple-leads'

const BADGE_TONE: Record<CoupleLead['status'], string> = {
  EN_ATTENTE: 'bg-gris/85 text-white',
  DEBLOQUEE: 'bg-highlight text-white',
  REFUSEE: 'bg-gris/45 text-white/85',
}

function PhotoFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bordeaux/10">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-bordeaux/25" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  )
}

function CardInner({ lead }: { lead: CoupleLead }) {
  const unlocked = isUnlockedLead(lead)
  const primary = unlocked ? lead.vendor.brandName : lead.category
  const requestedAt = formatRequestedAt(lead.requestedAt)

  return (
    <>
      {lead.photoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, next/image imposerait des dimensions absentes ici (cf. galerie WedDream). */
        <img
          src={lead.photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
        />
      ) : (
        <PhotoFallback />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-texte/85 via-texte/25 to-transparent" />

      <span
        className={[
          'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
          'text-[10px] font-semibold uppercase tracking-[0.12em]',
          BADGE_TONE[lead.status],
        ].join(' ')}
      >
        {unlocked && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
        {STATUS_LABELS[lead.status]}
      </span>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
        {primary && (
          <p className="font-cormorant text-[22px] font-medium leading-tight">{primary}</p>
        )}
        {lead.zones.length > 0 && (
          <p className="text-xs text-white/75">{lead.zones.join(' · ')}</p>
        )}
        {requestedAt && <p className="text-[11px] text-white/60">{requestedAt}</p>}
      </div>
    </>
  )
}

/**
 * Une demande de contact. `EN_ATTENTE` / `REFUSEE` : carte non cliquable,
 * masquée. `DEBLOQUEE` : carte cliquable vers l'Écran 4 (fiche prestataire),
 * avec un résumé au survol côté desktop.
 */
export function ContactRequestCard({ lead }: { lead: CoupleLead }) {
  const shell =
    'group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-bordeaux/10 bg-bordeaux/5'

  if (!isUnlockedLead(lead)) {
    return (
      <article className={`${shell} cursor-default`}>
        <CardInner lead={lead} />
      </article>
    )
  }

  const tooltipLines = leadTooltipLines(lead)

  return (
    <Link
      href={`/mon-espace/demandes/${lead.id}`}
      className={`${shell} no-underline outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-highlight/70 hover:shadow-[0_10px_30px_rgba(78,26,50,0.16)]`}
      aria-label={`Voir la fiche de ${lead.vendor.brandName}`}
    >
      <CardInner lead={lead} />

      <div
        role="tooltip"
        className="pointer-events-none absolute left-3 right-3 top-12 hidden rounded-xl border border-bordeaux/20 bg-creme px-4 py-3 opacity-0 shadow-[0_4px_16px_rgba(78,26,50,0.12)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
      >
        {tooltipLines.map((line, index) => (
          <span
            key={line}
            className={
              index === 0
                ? 'block font-cormorant text-[15px] font-medium italic text-bordeaux'
                : 'block text-[12px] leading-relaxed text-texte/75'
            }
          >
            {line}
          </span>
        ))}
      </div>
    </Link>
  )
}
