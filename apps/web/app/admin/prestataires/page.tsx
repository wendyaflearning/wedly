import Link from 'next/link'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { fetchAdminVendors } from '@/lib/admin'
import type { AdminVendorFilter, AdminVendorListItem, AdminVendorStatus } from '@/lib/admin-types'

import { AdminRetryButton } from '@/components/admin/AdminRetryButton'
import { AdminToast } from '@/components/admin/AdminToast'
import { AdminVendorTable } from '@/components/admin/AdminVendorTable'

const FILTERS: Array<{ value: AdminVendorFilter; label: string }> = [
  { value: 'under_review', label: 'En attente' },
  { value: 'active', label: 'Validés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'all', label: 'Tous' },
]

type StatusCounts = Record<AdminVendorFilter, number>

function resolveFilter(value?: string): AdminVendorFilter {
  if (value === 'active' || value === 'rejected' || value === 'all') return value
  return 'under_review'
}

function getFilterHref(filter: AdminVendorFilter): string {
  return filter === 'under_review' ? '/admin/prestataires' : `/admin/prestataires?status=${filter}`
}

function getStatusCounts(items: AdminVendorListItem[], totalAll: number): StatusCounts {
  const counts: StatusCounts = {
    under_review: 0,
    active: 0,
    rejected: 0,
    all: totalAll,
  }

  for (const item of items) {
    counts[item.status as AdminVendorStatus] += 1
  }

  return counts
}

function EmptyState({ filter, totalAll }: { filter: AdminVendorFilter; totalAll: number }) {
  const isBaseEmpty = totalAll === 0
  const title = isBaseEmpty
    ? 'Aucun prestataire inscrit pour le moment'
    : filter === 'under_review'
      ? 'Tout est à jour ✅'
      : 'Aucun profil pour ce filtre'
  const subtitle = isBaseEmpty
    ? "Les demandes apparaîtront ici dès qu'un prestataire aura complété son inscription."
    : filter === 'under_review'
      ? 'Aucun profil en attente de validation. Reviens plus tard pour la suite.'
      : 'Change de filtre pour consulter les autres profils.'

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-16 text-center shadow-sm">
      <ClipboardList size={78} strokeWidth={1.6} className="text-bordeaux/22" aria-hidden="true" />
      <h2 className="mt-9 font-cormorant text-[28px] font-semibold leading-tight text-bordeaux/75 md:text-[32px]">
        {title}
      </h2>
      <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-gris">{subtitle}</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-14 text-center shadow-sm">
      <AlertCircle size={56} strokeWidth={1.7} className="text-highlight" aria-hidden="true" />
      <h2 className="mt-6 font-cormorant text-[30px] font-semibold leading-tight text-bordeaux">
        Chargement impossible
      </h2>
      <p className="mt-3 max-w-[520px] text-sm leading-6 text-gris">
        La liste des profils prestataires n&apos;a pas pu être chargée.
      </p>
      <div className="mt-7">
        <AdminRetryButton />
      </div>
    </div>
  )
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; toast?: string }>
}) {
  const params = await searchParams
  const filter = resolveFilter(params.status)
  const [result, allResult] = await Promise.all([
    fetchAdminVendors(filter),
    fetchAdminVendors('all'),
  ])

  const allItems = allResult.ok ? allResult.data.items : result.ok ? result.data.items : []
  const totalAll = allResult.ok ? allResult.data.totalAll : result.ok ? result.data.totalAll : 0
  const counts = getStatusCounts(allItems, totalAll)

  return (
    <div className="flex flex-col gap-9">
      <AdminToast toast={params.toast} />

      <div className="flex flex-col gap-9">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-5">
          <h1 className="font-cormorant text-[42px] font-semibold leading-none text-bordeaux md:text-[48px]">
            Profils prestataires
          </h1>
          <p className="pb-1 text-[17px] font-semibold text-gris">
            {totalAll} {totalAll > 1 ? 'profils' : 'profil'} au total
          </p>
        </div>

        <div className="border-b border-bordeaux/10">
          <nav className="flex max-w-[650px] gap-3 overflow-x-auto md:gap-6" aria-label="Filtres prestataires">
            {FILTERS.map((item) => {
              const active = item.value === filter

              return (
                <Link
                  key={item.value}
                  href={getFilterHref(item.value)}
                  className={[
                    'flex h-[56px] shrink-0 items-center gap-2 border-b-2 px-3 text-[16px] font-semibold no-underline transition-colors md:min-w-[120px] md:px-6',
                    active
                      ? 'border-highlight text-bordeaux'
                      : 'border-transparent text-gris hover:text-bordeaux',
                  ].join(' ')}
                >
                  <span>{item.label}</span>
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-bordeaux/7 px-2 text-sm font-bold text-gris">
                    {counts[item.value]}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {!result.ok ? (
        <ErrorState />
      ) : result.data.items.length === 0 ? (
        <EmptyState filter={filter} totalAll={totalAll} />
      ) : (
        <AdminVendorTable items={result.data.items} />
      )}
    </div>
  )
}
