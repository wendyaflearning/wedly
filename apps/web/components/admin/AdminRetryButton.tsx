'use client'

import { RefreshCcw } from 'lucide-react'

export function AdminRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 rounded-md border border-bordeaux/20 bg-white px-4 py-2 text-sm font-semibold text-bordeaux shadow-sm transition-colors hover:bg-creme"
    >
      <RefreshCcw size={16} aria-hidden="true" />
      Réessayer
    </button>
  )
}
