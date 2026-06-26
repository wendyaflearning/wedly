'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Pencil } from 'lucide-react'
import type { AdminVendorInvitation } from '@/lib/admin-types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function AdminVendorInvitationTable({ items }: { items: AdminVendorInvitation[] }) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  async function copyInvitation(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/onboarding/${token}`)
    setCopiedToken(token)
    window.setTimeout(() => setCopiedToken(null), 1800)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-bordeaux/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-creme text-xs uppercase text-gris">
            <tr>
              <th className="px-6 py-5 font-bold">Prestataire</th>
              <th className="px-6 py-5 font-bold">Service</th>
              <th className="px-6 py-5 font-bold">Expiration</th>
              <th className="w-56 px-6 py-5 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordeaux/8 text-sm">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-texte">{item.brandName}</span>
                    <span className="text-xs text-texte/55">
                      {item.firstname} · {item.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-texte/70">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-texte">{item.service.name}</span>
                    <span className="max-w-[360px] text-xs leading-5 text-texte/55">
                      {item.regions.length > 0 ? item.regions.map((region) => region.name).join(', ') : 'Aucune région'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-texte/70">{formatDate(item.expiresAt)}</td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/vendors/${item.vendorId}/edit`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8c9ba] px-3 text-sm font-semibold text-texte no-underline transition-colors hover:border-bordeaux hover:text-bordeaux"
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Éditer
                    </Link>
                  <button
                    type="button"
                    onClick={() => copyInvitation(item.token)}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8c9ba] px-3 text-sm font-semibold text-texte transition-colors hover:border-bordeaux hover:text-bordeaux"
                  >
                    <Copy size={15} aria-hidden="true" />
                    {copiedToken === item.token ? 'Copié' : 'Copier'}
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
