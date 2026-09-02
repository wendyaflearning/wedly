'use client'

import { useMemo, useState } from 'react'
import {
  countByStatus,
  STATUS_FILTER_ORDER,
  STATUS_LABELS,
  type CoupleLead,
  type CoupleLeadStatus,
} from '@/lib/couple-leads'
import { ContactRequestCard } from './ContactRequestCard'

type Filter = 'ALL' | CoupleLeadStatus

const SectionLabel = () => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
    Demandes de contact
  </p>
)

function EmptyZone() {
  return (
    <section className="rounded-2xl border border-bordeaux/10 bg-white px-6 py-12 text-center md:px-10 md:py-16">
      <h2 className="font-cormorant text-2xl font-medium text-bordeaux md:text-[30px]">
        Aucune demande de contact pour l’instant
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gris">
        Dès que vous demandez à être mis·e en relation avec un prestataire depuis la galerie
        WedDream, la demande apparaît ici avec son statut et votre photo coup de cœur.
      </p>
    </section>
  )
}

/**
 * Pourquoi le couple vient d'être renvoyé ici depuis l'Écran 4. `role="status"`
 * plutôt que `alert` : c'est une explication, pas une erreur bloquante.
 */
function Notice({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="rounded-2xl border border-bordeaux/15 bg-bordeaux/5 px-5 py-4 text-sm leading-relaxed text-texte"
    >
      {message}
    </p>
  )
}

export function ContactRequestsZone({
  leads,
  notice,
}: {
  leads: CoupleLead[]
  notice?: string | null
}) {
  const [filter, setFilter] = useState<Filter>('ALL')

  const counts = useMemo(() => countByStatus(leads), [leads])
  const visible = useMemo(
    () => (filter === 'ALL' ? leads : leads.filter((lead) => lead.status === filter)),
    [leads, filter],
  )

  if (leads.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <SectionLabel />
        {notice && <Notice message={notice} />}
        <EmptyZone />
      </div>
    )
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Toutes', count: counts.ALL },
    ...STATUS_FILTER_ORDER.map((status) => ({
      key: status,
      label: STATUS_LABELS[status],
      count: counts[status],
    })),
  ]

  return (
    <div className="flex flex-col gap-6">
      {notice && <Notice message={notice} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionLabel />

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les demandes par statut">
          {filters.map(({ key, label, count }) => {
            const isActive = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={[
                  'rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors',
                  isActive
                    ? 'border-bordeaux bg-bordeaux text-creme'
                    : 'border-bordeaux/20 text-bordeaux/70 hover:border-bordeaux/40 hover:text-bordeaux',
                ].join(' ')}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((lead) => (
            <li key={lead.id}>
              <ContactRequestCard lead={lead} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-bordeaux/10 bg-white px-6 py-10 text-center text-sm text-gris">
          Aucune demande {STATUS_LABELS[filter as CoupleLeadStatus].toLowerCase()} pour l’instant.
        </p>
      )}
    </div>
  )
}
