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
    <div className="overflow-hidden rounded-lg border border-[#e3d7cb] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#fbf7f2] text-xs uppercase text-texte/55">
            <tr>
              <th className="px-5 py-4 font-semibold">Nom</th>
              <th className="px-5 py-4 font-semibold">Type</th>
              <th className="px-5 py-4 font-semibold">Date d&apos;inscription</th>
              <th className="px-5 py-4 font-semibold">Statut</th>
              <th className="w-12 px-5 py-4" aria-label="Action" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe6dc] text-sm">
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
                className="group outline-none transition-colors hover:bg-[#fbf7f2] focus:bg-[#fbf7f2]"
              >
                <td className="px-5 py-4 font-semibold text-texte">{item.name}</td>
                <td className="px-5 py-4 text-texte/70">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-texte">{item.vendorTypeLabel}</span>
                    <span className="max-w-[360px] text-xs leading-5 text-texte/55">
                      {item.services.length > 0 ? item.services.join(', ') : 'Non renseigné'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-texte/70">{formatDate(item.submittedAt)}</td>
                <td className="px-5 py-4">
                  <AdminStatusBadge status={item.status} label={item.statusLabel} />
                </td>
                <td className="px-5 py-4 text-texte/45 group-hover:text-bordeaux">
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
