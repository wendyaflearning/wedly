'use client'
import { useRouter } from 'next/navigation'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import { usePortfolioUpload } from '@/hooks/usePortfolioUpload'
import PortfolioUploaderDashboard from '@/components/portfolio/PortfolioUploaderDashboard'

const MAX_PHOTOS = 10

interface Props {
  initialPhotos: PortfolioImage[]
  vendorId:      string
}

export default function PortfolioPageClient({ initialPhotos, vendorId }: Props) {
  const router = useRouter()

  const hook = usePortfolioUpload({
    uploadFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/vendor/${vendorId}/portfolio`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur')
      return res.json() as Promise<PortfolioImage>
    },
    deleteFn: async (photoId: string) => {
      const res = await fetch(`/api/vendor/${vendorId}/portfolio/${photoId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('delete_failed')
    },
    setCoverFn: async (photoId: string) => {
      const res = await fetch(`/api/vendor/${vendorId}/portfolio/${photoId}/cover`, { method: 'PATCH' })
      if (!res.ok) throw new Error('cover_failed')
    },
    initialPhotos,
    maxPhotos: MAX_PHOTOS,
  })

  return (
    <div>
      <PortfolioUploaderDashboard {...hook} maxPhotos={MAX_PHOTOS} />

      {/* CTA — même pattern que l'étape disponibilités */}
      <div className="mt-6 md:mt-8 md:pt-5 md:border-t md:border-bordeaux/[0.08]">

        {/* Mobile : pleine largeur */}
        <button
          type="button"
          onClick={() => router.push('/profil/tarifs')}
          disabled={hook.count < 1}
          className="md:hidden w-full py-4 bg-accent text-creme rounded-full text-[12px] font-semibold tracking-[0.18em] uppercase disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-manrope-var)' }}
        >
          Continuer · Étape 03 →
        </button>

        {/* Desktop : aligné à droite */}
        <div className="hidden md:flex justify-end">
          <button
            type="button"
            onClick={() => router.push('/profil/tarifs')}
            disabled={hook.count < 1}
            className="px-5 py-2 text-[11px] tracking-[0.12em] uppercase bg-accent text-creme rounded-full transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            Continuer · Étape 03 →
          </button>
        </div>

      </div>
    </div>
  )
}
