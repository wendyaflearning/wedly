import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ContactRequestsError } from '@/components/couple/contact-requests/ContactRequestsError'
import { UnlockedVendorSheet } from '@/components/couple/contact-requests/UnlockedVendorSheet'
import { isUnlockedLead } from '@/lib/couple-leads'
import { fetchCoupleLeads } from '@/lib/couple-leads.server'

export const metadata: Metadata = {
  title: 'Fiche prestataire | Mon espace Wedly',
  description: 'La fiche complète du prestataire qui a accepté votre demande de contact.',
}

type PageProps = { params: Promise<{ leadId: string }> }

export default async function UnlockedVendorPage({ params }: PageProps) {
  const { leadId } = await params
  const result = await fetchCoupleLeads()

  if (!result.ok) return <ContactRequestsError />

  const lead = result.items.find((item) => item.id === leadId)

  // Demande inconnue ou pas encore débloquée : rien à dévoiler, retour à la liste.
  if (!lead || !isUnlockedLead(lead)) redirect('/mon-espace/demandes')

  return <UnlockedVendorSheet lead={lead} />
}
