import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { fetchAdminVendor } from '@/lib/admin'
import { AdminProfileActions } from '@/components/admin/AdminProfileActions'
import { AdminRetryButton } from '@/components/admin/AdminRetryButton'
import { ProfileView } from '@/components/profile/ProfileView'

export default async function AdminVendorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await fetchAdminVendor(id)

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/admin/prestataires"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dfd2c6] bg-white px-3 py-2 text-sm font-semibold text-texte/70 no-underline hover:text-texte"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Retour
        </Link>
        <div className="rounded-lg border border-danger-border bg-white px-6 py-10 text-center">
          <h1 className="font-cormorant text-3xl font-semibold text-danger">Chargement impossible</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-texte/65">
            Une erreur est survenue pendant le chargement du profil.
          </p>
          <div className="mt-5">
            <AdminRetryButton />
          </div>
        </div>
      </div>
    )
  }

  const profile = result.data

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/prestataires"
        className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dfd2c6] bg-white px-3 py-2 text-sm font-semibold text-texte/70 no-underline hover:text-texte"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Retour
      </Link>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-texte/55">{profile.vendorTypeLabel}</p>
        <h1 className="font-cormorant text-4xl font-semibold text-bordeaux">{profile.summary.brandName}</h1>
        <p className="text-sm text-texte/65">{profile.summary.email}</p>
      </div>

      <AdminProfileActions profile={profile} />
      <ProfileView profile={profile} />
    </div>
  )
}
