import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { fetchVendorProviderLeads } from '@/lib/vendor'
import { LeadDetailClient } from './_components/LeadDetailClient'

export const metadata: Metadata = {
  title: 'Demande de mise en relation | Espace prestataire Wedly',
  description: 'Le détail d’une demande de mise en relation reçue via WedDream.',
}

type PageProps = { params: Promise<{ id: string }> }

/**
 * Le détail d'une demande — une page, pas une modal : le mail de notification
 * (WED-51) pointe directement ici, et un deep-link doit s'ouvrir sans passer par
 * la liste.
 *
 * TODO(WED-52) : on retrouve la demande en filtrant la liste par id au lieu
 * d'appeler un GET single-lead, qui n'existe pas côté backend — simplification
 * assumée (récap Notion du 03/09), et déjà le parti pris du parcours couple
 * (`app/mon-espace/demandes/[leadId]/page.tsx`). À rembourser le jour où charger
 * toutes les demandes pour en lire une seule coûte quelque chose.
 */
export default async function VendorLeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const leads = await fetchVendorProviderLeads()

  // `null` = lecture impossible (session expirée, API muette), pas « demande
  // absente » : un 404 ferait croire au prestataire que sa demande a disparu.
  if (leads === null) redirect('/dashboard/wedream')

  const lead = leads.find((item) => item.id === id)
  if (!lead) notFound()

  return <LeadDetailClient lead={lead} />
}
