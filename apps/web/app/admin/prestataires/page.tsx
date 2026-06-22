import Link from 'next/link'
import { fetchAdminVendors } from '@/lib/admin'
import type { AdminVendorFilter } from '@/lib/admin-types'

import { AdminToast } from '@/components/admin/AdminToast'
import { AdminVendorTable } from '@/components/admin/AdminVendorTable'

const FILTERS: Array<{ value: AdminVendorFilter; label: string }> = [
  { value: 'under_review', label: 'En attente' },
  { value: 'active', label: 'Validés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'all', label: 'Tous' },
]

function resolveFilter(value?: string): AdminVendorFilter {
  if (value === 'active' || value === 'rejected' || value === 'all') return value
  return 'under_review'
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
    <div className="rounded-lg border border-[#e3d7cb] bg-white px-6 py-12 text-center">
      <h2 className="font-cormorant text-3xl font-semibold text-bordeaux">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-texte/65">{subtitle}</p>
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
  const result = await fetchAdminVendors(filter)

  return (
    <div className="flex flex-col gap-6">
      <AdminToast toast={params.toast} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-texte/55">Espace admin</p>
        <h1 className="font-cormorant text-4xl font-semibold text-bordeaux">Profils prestataires</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = item.value === filter
          const href = item.value === 'under_review' ? '/admin/prestataires' : `/admin/prestataires?status=${item.value}`

          return (
            <Link
              key={item.value}
              href={href}
              className={`rounded-md border px-4 py-2 text-sm font-semibold no-underline transition-colors ${
                active
                  ? 'border-bordeaux bg-bordeaux text-creme'
                  : 'border-[#dfd2c6] bg-white text-texte/70 hover:text-texte'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {!result.ok ? (
        <EmptyState filter={filter} totalAll={0} />
      ) : result.data.items.length === 0 ? (
        <EmptyState filter={filter} totalAll={result.data.totalAll} />
      ) : (
        <AdminVendorTable items={result.data.items} />
      )}
    </div>
  )
}
