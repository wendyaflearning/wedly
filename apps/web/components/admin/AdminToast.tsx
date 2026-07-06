'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const TOAST_MESSAGES: Record<string, string> = {
  validated: 'Profil validé',
  rejected: 'Profil refusé',
  'draft-deleted': 'Brouillon supprimé',
}

export function AdminToast({ toast }: { toast?: string }) {
  const message = toast ? TOAST_MESSAGES[toast] : undefined
  const [visible, setVisible] = useState(Boolean(message))

  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setVisible(false), 4200)
    return () => window.clearTimeout(timeout)
  }, [message])

  if (!visible || !message) return null

  return (
    <div className="fixed right-5 top-5 z-50 flex min-h-11 items-center gap-3 rounded-md border border-bordeaux/15 bg-white px-4 py-3 text-sm font-semibold text-bordeaux shadow-lg">
      <CheckCircle2 size={18} aria-hidden="true" />
      {message}
    </div>
  )
}
