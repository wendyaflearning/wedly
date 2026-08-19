import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchServiceTree } from '@/lib/admin'
import { fetchServiceTagTypes, findPrimaryTagType, findServiceBySlug } from '@/lib/specialties'
import SpecialtyCard from './_components/SpecialtyCard'

type SpecialtiesPageProps = {
  params: Promise<{ slug: string }>
}

async function getMetier(slug: string) {
  const tree = await fetchServiceTree()
  const service = findServiceBySlug(tree, slug)
  if (!service) return null

  const primary = findPrimaryTagType(await fetchServiceTagTypes(service.id))

  return { service, primary }
}

export async function generateMetadata({ params }: SpecialtiesPageProps): Promise<Metadata> {
  const { slug } = await params
  const metier = await getMetier(slug)

  if (!metier) return { title: 'Spécialités | Wedly' }

  return {
    title: `${metier.service.name} — Spécialités | Wedly`,
    description: `Choisissez le style de ${metier.service.name.toLowerCase()} qui vous ressemble.`,
  }
}

export default async function SpecialtiesPage({ params }: SpecialtiesPageProps) {
  const { slug } = await params
  const metier = await getMetier(slug)

  if (!metier) notFound()

  const { service, primary } = metier
  const tagValues = primary?.tagValues ?? []

  return (
    <div className="bg-creme min-h-screen" style={{ fontFamily: 'var(--font-manrope-var)' }}>
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-[22px] px-6 pt-7 pb-9 md:px-8">
        <div className="flex flex-col gap-[22px]">
          <div className="flex items-center gap-[9px]">
            <Link
              href="/wedream-vendors"
              className="text-gris inline-flex items-center gap-[7px] text-[10px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-65"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M19 12H5M5 12L11 6M5 12L11 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {service.name}
            </Link>
            <span className="text-texte/30 text-[10px]">→</span>
            <span className="text-accent text-[10px] font-semibold uppercase tracking-[0.2em]">
              Spécialités
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1
              className="font-cormorant text-bordeaux m-0 font-bold italic leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(38px,7vw,68px)' }}
            >
              {service.name}
            </h1>
            <div className="bg-accent h-px w-11" />
            <p className="font-cormorant text-accent m-0 text-[18px] font-light italic">
              De votre choix, à portée de main.
            </p>
            {tagValues.length > 0 && (
              <p className="text-gris m-0 mt-1 text-[10px] font-medium uppercase tracking-[0.16em]">
                {tagValues.length} {tagValues.length > 1 ? 'styles' : 'style'}
              </p>
            )}
          </div>
        </div>

        {tagValues.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {tagValues.map((tagValue, index) => (
                <SpecialtyCard
                  key={tagValue.id}
                  tagValue={tagValue}
                  index={index}
                  /* TODO(WED-43) : cibler la galerie filtrée quand l'écran existera. */
                  href="#"
                />
              ))}
            </div>

            <p className="font-cormorant text-gris m-0 mt-0.5 text-[17px] font-light italic">
              Une même photo peut apparaître dans deux styles.
            </p>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="font-cormorant text-bordeaux m-0 max-w-[420px] text-center text-[22px] font-light italic leading-[1.45]">
              Les styles de ce métier arrivent très bientôt.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
