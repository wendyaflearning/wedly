import type { Metadata } from 'next'
import { ContactRequestsError } from '@/components/couple/contact-requests/ContactRequestsError'
import { ContactRequestsZone } from '@/components/couple/contact-requests/ContactRequestsZone'
import { fetchCoupleLeads } from '@/lib/couple-leads.server'

export const metadata: Metadata = {
  title: 'Demandes de contact | Mon espace Wedly',
  description: 'Suivez vos demandes de contact avec les prestataires Wedly et leur statut.',
}

export default async function CoupleDemandesPage() {
  const result = await fetchCoupleLeads()

  if (!result.ok) return <ContactRequestsError />

  return <ContactRequestsZone leads={result.items} />
}
