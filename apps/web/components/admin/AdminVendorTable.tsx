'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Trash2 } from 'lucide-react'
import type { AdminVendorListItem } from '@/lib/admin-types'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function AdminVendorTable({
  items,
  hrefVariant = 'profile',
}: {
  items: AdminVendorListItem[]
  hrefVariant?: 'profile' | 'draft'
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const getHref = (item: AdminVendorListItem) =>
    hrefVariant === 'draft' ? `/admin/vendors/${item.id}/edit` : `/admin/prestataires/${item.id}`

  async function deleteDraft(item: AdminVendorListItem) {
    if (deletingId !== null) return
    const confirmed = window.confirm(`Supprimer le brouillon "${item.name}" ?`)
    if (!confirmed) return

    setDeletingId(item.id)
    const response = await fetch(`/api/admin/vendors/${item.id}/draft`, { method: 'DELETE' })
    setDeletingId(null)

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}))
      window.alert(typeof data.error === 'string' ? data.error : 'La suppression du brouillon a échoué.')
      return
    }

    router.push('/admin/prestataires?view=drafts&toast=draft-deleted')
    router.refresh()
  }

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
            {items.map((item) => {
              const href = getHref(item)

              return (
                <tr key={item.id} className="group transition-colors hover:bg-creme">
                  <td className="px-6 py-5 font-semibold text-texte">
                    <Link href={href} className="text-texte no-underline hover:text-bordeaux">
                      {item.name}
                    </Link>
                  </td>
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
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={href}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gris transition-colors hover:bg-bordeaux/5 hover:text-bordeaux"
                        aria-label={`Ouvrir ${item.name}`}
                      >
                        <Eye size={18} aria-hidden="true" />
                      </Link>
                      {hrefVariant === 'draft' && (
                        <button
                          type="button"
                          onClick={() => void deleteDraft(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gris transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-45"
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
