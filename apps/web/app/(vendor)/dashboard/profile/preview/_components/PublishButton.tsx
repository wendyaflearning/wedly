'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProfileCompletion } from '@/lib/vendor'
import { canPublishProfile, missingSections } from '@/lib/vendor-publish'

/**
 * Mêmes gabarits que le lien « Modifier mon profil » voisin : sur mobile les deux
 * se réduisent à leur icône, côte à côte dans la barre d'aperçu.
 */
const BASE_CLASSES =
  'flex font-manrope text-[11px] font-semibold tracking-[0.12em] uppercase bg-bordeaux text-creme px-3 md:px-5 py-2 md:py-2.5 rounded-full items-center gap-1.5'

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export interface PublishButtonViewProps {
  /** Sections manquantes, vide si le profil est publiable. */
  missing: { label: string; href: string }[]
  isPublished: boolean
  isSubmitting: boolean
  error: string | null
  onPublish: () => void
}

/**
 * Vue pure, sans état ni réseau : c'est elle que couvrent les tests.
 * L'état « incomplet » ne liste pas les sections manquantes — la page pose déjà
 * un badge « À compléter » sur chacune. Le titre sert d'indice au survol.
 */
export function PublishButtonView({
  missing,
  isPublished,
  isSubmitting,
  error,
  onPublish,
}: PublishButtonViewProps) {
  if (isPublished) {
    return (
      <button
        disabled
        aria-label="Profil publié"
        className={`${BASE_CLASSES} opacity-40 cursor-not-allowed`}
      >
        <span className="hidden sm:inline">Profil publié</span>
        <CheckIcon />
      </button>
    )
  }

  const isIncomplete = missing.length > 0
  const disabled = isIncomplete || isSubmitting

  return (
    <>
      {error && (
        <p
          className="font-manrope text-[11px] text-accent max-w-[110px] sm:max-w-[220px] truncate"
          title={error}
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onPublish}
        disabled={disabled}
        aria-disabled={disabled}
        title={
          isIncomplete
            ? `À compléter avant publication : ${missing.map((s) => s.label).join(', ')}`
            : undefined
        }
        aria-label={isSubmitting ? 'Publication en cours' : 'Publier mon profil'}
        className={
          disabled
            ? `${BASE_CLASSES} opacity-40 cursor-not-allowed`
            : `${BASE_CLASSES} hover:bg-bordeaux/90 transition-colors`
        }
      >
        <span className="hidden sm:inline">
          {isSubmitting ? 'Publication…' : 'Publier mon profil'}
        </span>
        <ArrowIcon />
      </button>
    </>
  )
}

interface Props {
  completion: ProfileCompletion
  isPublished: boolean
}

export default function PublishButton({ completion, isPublished }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [published, setPublished] = useState(isPublished)
  const [error, setError] = useState<string | null>(null)
  // Les sections manquantes remontées par un 422 font autorité sur le calcul local.
  const [rejected, setRejected] = useState<string[] | null>(null)

  const missing = rejected
    ? rejected.map((label) => ({ label, href: '/dashboard/profile' }))
    : missingSections(completion)

  async function publish() {
    if (isSubmitting || !canPublishProfile(completion)) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/vendors/me/publish', { method: 'POST' })
      const body = await res.json().catch(() => ({}))

      if (res.status === 422) {
        const sections: string[] = body.missing_sections ?? []
        setRejected(sections)
        setError(
          sections.length > 0
            ? `À compléter : ${sections.join(', ')}.`
            : 'Votre profil n’est pas encore complet.'
        )
        return
      }

      if (!res.ok) {
        setError(body.error ?? 'La publication a échoué. Réessayez.')
        return
      }

      setPublished(true)
      // Recharge les données serveur pour que is_published reflète la publication.
      router.refresh()
    } catch {
      setError('Connexion perdue. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublishButtonView
      missing={missing}
      isPublished={published}
      isSubmitting={isSubmitting}
      error={error}
      onPublish={publish}
    />
  )
}
