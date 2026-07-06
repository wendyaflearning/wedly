'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DraftDeleteButton({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function deleteDraft() {
    if (deleting) return
    const confirmed = window.confirm(`Supprimer le brouillon "${vendorName}" ?`)
    if (!confirmed) return

    setDeleting(true)
    const response = await fetch(`/api/admin/vendors/${vendorId}/draft`, { method: 'DELETE' })
    setDeleting(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      window.alert(typeof data.error === 'string' ? data.error : 'La suppression du brouillon a échoué.')
      return
    }

    router.push('/admin/prestataires?view=drafts&toast=draft-deleted')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void deleteDraft()}
      disabled={deleting}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gris transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-45"
      aria-label={`Supprimer ${vendorName}`}
    >
      <Trash2 size={17} aria-hidden="true" />
    </button>
  )
}
