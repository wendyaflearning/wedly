'use client'

import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import type { AdminVendorListItem } from '@/lib/admin-types'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function AdminVendorTable({ items }: { items: AdminVendorListItem[] }) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-lg border border-bordeaux/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-creme text-xs uppercase text-gris">
            <tr>
              <th className="px-6 py-5 font-bold">Nom</th>
              <th className="px-6 py-5 font-bold">Type</th>
              <th className="px-6 py-5 font-bold">Date d&apos;inscription</th>
              <th className="px-6 py-5 font-bold">Statut</th>
              <th className="w-12 px-6 py-5" aria-label="Action" />
            </tr>
          </thead>
          <tbody className="divide-y divide-bordeaux/8 text-sm">
            {items.map((item) => (
              <tr
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => router.push(`/admin/prestataires/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    router.push(`/admin/prestataires/${item.id}`)
                  }
                }}
                className="group outline-none transition-colors hover:bg-creme focus:bg-creme"
              >
                <td className="px-6 py-5 font-semibold text-texte">{item.name}</td>
                <td className="px-6 py-5 text-texte/70">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-texte">{item.vendorTypeLabel}</span>
                    <span className="max-w-[360px] text-xs leading-5 text-texte/55">
                      {item.services.length > 0 ? item.services.join(', ') : 'Non renseigné'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-texte/70">{formatDate(item.submittedAt)}</td>
                <td className="px-6 py-5">
                  <AdminStatusBadge status={item.status} label={item.statusLabel} />
                </td>
                <td className="px-6 py-5 text-gris group-hover:text-bordeaux">
                  <Eye size={18} aria-hidden="true" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
