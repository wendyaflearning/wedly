import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchInitialCtaStatuses } from '@/lib/couple-cta-status'
import { fetchTagValuePortfolioImages } from '@/lib/wedream-gallery'
import { getService } from '../_lib/service'
import PortfolioGrid from './_components/PortfolioGrid'

const FIRST_PAGE_SIZE = 24

type GalleryPageProps = {
  params: Promise<{ slug: string; tagValueId: string }>
}

async function getTagValue(slug: string, tagValueId: string) {
  const resolved = await getService(slug)
  if (!resolved) return null

  const tagValue = resolved.primary?.tagValues.find((candidate) => candidate.id === tagValueId)
  if (!tagValue) return null

  return { service: resolved.service, tagValue }
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug, tagValueId } = await params
  const resolved = await getTagValue(slug, tagValueId)

  if (!resolved) return { title: 'Galerie | Wedly' }

  return {
    title: `${resolved.tagValue.label} — ${resolved.service.name} | Wedly`,
    description: `Parcourez les photos ${resolved.tagValue.label.toLowerCase()} de nos ${resolved.service.name.toLowerCase()}.`,
  }
}

export default async function TagValueGalleryPage({ params }: GalleryPageProps) {
  const { slug, tagValueId } = await params
  const resolved = await getTagValue(slug, tagValueId)

  if (!resolved) notFound()

  const { service, tagValue } = resolved

  // Les photos ne dépendent pas des gestes déjà posés : les enchaîner ferait
  // payer deux allers-retours au premier rendu pour rien.
  const [page, initialCtaStatuses] = await Promise.all([
    fetchTagValuePortfolioImages(tagValueId, { limit: FIRST_PAGE_SIZE }),
    fetchInitialCtaStatuses(),
  ])

  return (
    <div className="bg-creme min-h-screen" style={{ fontFamily: 'var(--font-manrope-var)' }}>
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-[22px] px-6 pt-7 pb-9 md:px-8">
        <div className="flex flex-col gap-[22px]">
          <div className="flex items-center gap-[9px]">
            <Link
              href={`/wedream-vendors/${slug}`}
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
              {tagValue.label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1
              className="font-cormorant text-bordeaux m-0 font-bold italic leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(38px,7vw,68px)' }}
            >
              {tagValue.label}
            </h1>
            <div className="bg-accent h-px w-11" />
            <p className="font-cormorant text-accent m-0 text-[18px] font-light italic">
              Toutes les photos, un seul regard.
            </p>
            {page.total > 0 && (
              <p className="text-gris m-0 mt-1 text-[10px] font-medium uppercase tracking-[0.16em]">
                {page.total} {page.total > 1 ? 'photos' : 'photo'}
              </p>
            )}
          </div>
        </div>

        {page.total > 0 ? (
          <PortfolioGrid
            tagValueId={tagValueId}
            label={tagValue.label}
            initialItems={page.items}
            initialNextCursor={page.nextCursor}
            initialTotal={page.total}
            initialCtaStatuses={initialCtaStatuses}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="font-cormorant text-bordeaux m-0 max-w-[420px] text-center text-[22px] font-light italic leading-[1.45]">
              Les photos de ce style arrivent très bientôt.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
