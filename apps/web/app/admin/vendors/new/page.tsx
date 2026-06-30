import { redirect } from 'next/navigation'
import { AdminVendorDraftForm } from '@/components/admin/AdminVendorDraftForm'
import type { ConfessionOption, CultureOption, RegionOption, ServiceOptionNode } from '@/lib/admin-types'

async function fetchPublicOptions<T>(path: string): Promise<T[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return []

  const response = await fetch(`${apiUrl}${path}`, { cache: 'no-store' }).catch(() => null)
  if (!response?.ok) return []

  return response.json() as Promise<T[]>
}

export default async function NewAdminVendorPage() {
  const [services, regions, cultures, confessions] = await Promise.all([
    fetchPublicOptions<ServiceOptionNode>('/api/v1/services'),
    fetchPublicOptions<RegionOption>('/api/v1/regions'),
    fetchPublicOptions<CultureOption>('/api/v1/cultures'),
    fetchPublicOptions<ConfessionOption>('/api/v1/confessions'),
  ])

  if (services.length === 0 || regions.length === 0) {
    redirect('/admin/prestataires?toast=load-error')
  }

  return (
    <AdminVendorDraftForm
      services={services}
      regions={regions}
      cultures={cultures}
      confessions={confessions}
    />
  )
}
