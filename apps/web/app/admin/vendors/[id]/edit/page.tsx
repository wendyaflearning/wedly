import { notFound, redirect } from 'next/navigation'
import { AdminVendorDraftForm } from '@/components/admin/AdminVendorDraftForm'
import { fetchAdminVendorDraft, fetchAdminVendorFormOptions } from '@/lib/admin'

export default async function EditAdminVendorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [draftResult, formOptions] = await Promise.all([
    fetchAdminVendorDraft(id),
    fetchAdminVendorFormOptions(),
  ])

  if (!draftResult.ok) {
    if (draftResult.status === 404) notFound()
    redirect('/admin/prestataires?toast=load-error')
  }

  return (
    <AdminVendorDraftForm
      draft={draftResult.data}
      services={formOptions.services}
      regions={formOptions.regions}
      cultures={formOptions.cultures}
      confessions={formOptions.confessions}
    />
  )
}
