import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { fetchAdminServiceTagTypes, fetchServiceTree } from '@/lib/admin'
import { flattenLeafServices } from '@/lib/taxonomy'
import { AdminRetryButton } from '@/components/admin/AdminRetryButton'
import { TaxonomyDetailClient } from './_components/TaxonomyDetailClient'

export default async function AdminTaxonomieServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params
  const [tree, tagTypesResult] = await Promise.all([
    fetchServiceTree(),
    fetchAdminServiceTagTypes(serviceId),
  ])

  const leaf = flattenLeafServices(tree).find((service) => service.id === serviceId)

  if (!leaf || !tagTypesResult.ok) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/admin/taxonomie"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dfd2c6] bg-white px-3 py-2 text-sm font-semibold text-texte/70 no-underline hover:text-texte"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Tags &amp; Catégories
        </Link>
        <div className="rounded-lg border border-danger-border bg-white px-6 py-10 text-center">
          <h1 className="font-cormorant text-3xl font-semibold text-danger">Chargement impossible</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-texte/65">
            Ce métier est introuvable ou ses catégories n&apos;ont pas pu être chargées.
          </p>
          <div className="mt-5">
            <AdminRetryButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/taxonomie"
        className="inline-flex w-fit items-center gap-2 rounded-md border border-[#dfd2c6] bg-white px-3 py-2 text-sm font-semibold text-texte/70 no-underline hover:text-texte"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Tags &amp; Catégories
      </Link>
      <TaxonomyDetailClient serviceId={serviceId} serviceName={leaf.name} tagTypes={tagTypesResult.data} />
    </div>
  )
}
