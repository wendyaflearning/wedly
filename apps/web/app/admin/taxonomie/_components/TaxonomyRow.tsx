'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function TaxonomyRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter()

  return (
    <tr
      onClick={() => router.push(href)}
      className="group cursor-pointer transition-colors hover:bg-creme"
    >
      {children}
    </tr>
  )
}
