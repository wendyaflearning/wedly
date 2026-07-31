import { redirect } from 'next/navigation'
import { AdminVendorDraftForm } from '@/components/admin/AdminVendorDraftForm'
import { fetchAdminVendorFormOptions } from '@/lib/admin'

export default async function NewAdminVendorPage() {
  const { services, regions, cultures, confessions, styles, specialties } =
    await fetchAdminVendorFormOptions()

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
