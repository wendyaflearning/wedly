import { notFound, redirect } from 'next/navigation'
import { AdminVendorDraftForm } from '@/components/admin/AdminVendorDraftForm'
import { fetchAdminVendorDraft } from '@/lib/admin'
import type { ConfessionOption, CultureOption, RegionOption, ServiceOptionNode } from '@/lib/admin-types'

async function fetchPublicOptions<T>(path: string): Promise<T[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return []

  const response = await fetch(`${apiUrl}${path}`, { cache: 'no-store' }).catch(() => null)
  if (!response?.ok) return []

  return response.json() as Promise<T[]>
}

export default async function EditAdminVendorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [draftResult, services, regions, cultures, confessions] = await Promise.all([
    fetchAdminVendorDraft(id),
    fetchPublicOptions<ServiceOptionNode>('/api/v1/services'),
    fetchPublicOptions<RegionOption>('/api/v1/regions'),
    fetchPublicOptions<CultureOption>('/api/v1/cultures'),
    fetchPublicOptions<ConfessionOption>('/api/v1/confessions'),
  ])

  if (!draftResult.ok) {
    if (draftResult.status === 404) notFound()
    redirect('/admin/prestataires?toast=load-error')
  }

  return (
    <AdminVendorDraftForm
      draft={draftResult.data}
      services={services}
      regions={regions}
      cultures={cultures}
      confessions={confessions}
    />
  )
}
