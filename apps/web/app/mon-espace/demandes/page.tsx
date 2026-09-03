import type { Metadata } from 'next'
import { ContactRequestsError } from '@/components/couple/contact-requests/ContactRequestsError'
import { ContactRequestsZone } from '@/components/couple/contact-requests/ContactRequestsZone'
import { leadNoticeMessage } from '@/lib/couple-leads'
import { fetchCoupleLeads } from '@/lib/couple-leads.server'

export const metadata: Metadata = {
  title: 'Demandes de contact | Mon espace Wedly',
  description: 'Suivez vos demandes de contact avec les prestataires Wedly et leur statut.',
}

type PageProps = { searchParams: Promise<{ indisponible?: string }> }

export default async function CoupleDemandesPage({ searchParams }: PageProps) {
  const [result, params] = await Promise.all([fetchCoupleLeads(), searchParams])

  if (!result.ok) return <ContactRequestsError />

  return (
    <ContactRequestsZone
      leads={result.items}
      notice={leadNoticeMessage(params.indisponible)}
    />
  )
}
