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

  // Rien à dévoiler dans les deux cas, mais le couple mérite de savoir lequel :
  // le retour muet vers la liste ne disait pas si la demande n'existait plus ou
  // si le prestataire n'avait simplement pas encore répondu.
  if (!lead) redirect('/mon-espace/demandes?indisponible=introuvable')
  if (!isUnlockedLead(lead)) redirect('/mon-espace/demandes?indisponible=verrouillee')

  return <UnlockedVendorSheet lead={lead} />
}
