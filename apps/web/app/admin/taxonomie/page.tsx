import Link from 'next/link'
import { ChevronRight, Tags } from 'lucide-react'
import { fetchAdminServiceTagTypes, fetchServiceTree } from '@/lib/admin'
import { flattenLeafServices } from '@/lib/taxonomy'
import { AdminRetryButton } from '@/components/admin/AdminRetryButton'
import { TaxonomyRow } from './_components/TaxonomyRow'

async function getMetierRows() {
  const tree = await fetchServiceTree()
  const leaves = flattenLeafServices(tree)

  const counts = await Promise.all(
    leaves.map(async (leaf) => {
      const result = await fetchAdminServiceTagTypes(leaf.id)
      if (!result.ok) return null
      return result.data.filter((tagType) => tagType.isActive).length
    })
  )

  return leaves.map((leaf, index) => ({
    id: leaf.id,
    name: leaf.name,
    activeTagTypeCount: counts[index],
  }))
}

export default async function AdminTaxonomiePage() {
  const rows = await getMetierRows()

  return (
    <div className="flex flex-col gap-9">
      <div className="flex items-baseline gap-3">
        <h1 className="font-cormorant text-[42px] font-semibold leading-none text-bordeaux md:text-[48px]">
          Tags &amp; Catégories
        </h1>
        <p className="pb-1 text-[15px] font-semibold text-gris">
          {rows.length} {rows.length > 1 ? 'métiers' : 'métier'}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-bordeaux/10 bg-white px-6 py-14 text-center shadow-sm">
          <Tags size={56} strokeWidth={1.6} className="text-bordeaux/22" aria-hidden="true" />
          <h2 className="mt-6 font-cormorant text-[30px] font-semibold leading-tight text-bordeaux">
            Chargement impossible
          </h2>
          <p className="mt-3 max-w-[520px] text-sm leading-6 text-gris">
            La liste des métiers n&apos;a pas pu être chargée.
          </p>
          <div className="mt-7">
            <AdminRetryButton />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-bordeaux/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-creme text-xs uppercase text-gris">
                <tr>
                  <th className="px-6 py-5 font-bold">Nom du métier</th>
                  <th className="px-6 py-5 text-right font-bold">Catégories actives</th>
                  <th className="w-12 px-6 py-5" aria-label="Action" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bordeaux/8 text-sm">
                {rows.map((row) => (
                  <TaxonomyRow key={row.id} href={`/admin/taxonomie/${row.id}`}>
                    <td className="px-6 py-5 font-semibold text-texte">
                      <Link
                        href={`/admin/taxonomie/${row.id}`}
                        className="text-texte no-underline hover:text-bordeaux"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-right text-texte/70">
                      {row.activeTagTypeCount === null ? (
                        <span className="text-xs font-semibold text-danger">Erreur</span>
                      ) : (
                        <span className="font-semibold text-texte">
                          {row.activeTagTypeCount}
                          <span className="ml-1 font-medium text-texte/45">
                            catégorie{row.activeTagTypeCount > 1 ? 's' : ''}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-gris group-hover:text-bordeaux">
                      <ChevronRight size={16} aria-hidden="true" className="ml-auto" />
                    </td>
                  </TaxonomyRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
