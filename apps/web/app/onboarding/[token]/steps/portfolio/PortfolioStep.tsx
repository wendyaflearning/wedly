'use client'
import { useRef, useState } from 'react'
import type { PortfolioData, PortfolioImage, VendorType } from '../../types'

// ─── PhotoSlot ───────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  preview: string | null
  savedImageId: string | null   // null = fichier local non encore persisté
  height: number
  label: string
  iconSize: number
  isCover?: boolean
  onUpload: (file: File) => void
  onDelete: () => Promise<boolean>
}

function PhotoSlot({
  preview, savedImageId, height, label, iconSize, isCover = false, onUpload, onDelete,
}: PhotoSlotProps) {
  const inputRef               = useRef<HTMLInputElement>(null)
  const [active, setActive]    = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]    = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    const ok = await onDelete()
    setDeleting(false)
    if (ok) setConfirming(false)
  }

  function handleDeleteClick() {
    if (savedImageId) {
      setConfirming(true)
    } else {
      // Fichier local uniquement — pas de confirmation nécessaire
      if (inputRef.current) inputRef.current.value = ''
      onDelete()
    }
  }

  const OVERLAY_BG = 'rgba(41, 26, 16, 0.78)'

  // ── Slot vide ──
  if (!preview) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onTouchStart={() => setActive(true)}
        onTouchEnd={() => setActive(false)}
        style={{
          width: '100%', height,
          border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
          borderRadius: 12,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: iconSize > 24 ? 10 : 6,
          cursor: 'pointer',
          background: active ? 'rgba(78, 26, 50, 0.03)' : 'transparent',
          transform: active ? 'scale(0.98)' : 'scale(1)',
          transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" stroke="#E35704" strokeWidth="1.2" />
          <path d="M16 10v12M10 16h12" stroke="#E35704" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          className="font-josefin uppercase text-center"
          style={{ fontSize: iconSize > 24 ? 11 : 10, letterSpacing: '0.07em', color: 'rgba(78,26,50,0.44)', lineHeight: 1.5, padding: '0 8px', whiteSpace: 'pre-line' }}
        >
          {label}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
        />
      </div>
    )
  }

  // ── Slot rempli ──
  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden' }}>
      <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Bouton × — zone tactile 44×44, icône centrée */}
      {!confirming && !deleting && (
        <button
          onClick={handleDeleteClick}
          aria-label="Supprimer"
          style={{
            position: 'absolute', top: 0, right: 0,
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(41,26,16,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2l6 6M8 2l-6 6" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      )}

      {/* Overlay confirmation / spinner */}
      {(confirming || deleting) && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: OVERLAY_BG,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: isCover ? 16 : 12,
            borderRadius: 12,
          }}
        >
          {deleting ? (
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="rgba(255,246,237,0.25)" strokeWidth="2" />
              <path d="M14 3a11 11 0 0 1 11 11" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : isCover ? (
            /* Grand slot — texte + deux boutons */
            <>
              <p className="font-cormorant italic" style={{ fontSize: 15, color: '#FFF6ED', margin: 0, letterSpacing: '0.01em' }}>
                Supprimer ?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirming(false)}
                  className="font-josefin uppercase"
                  style={{
                    minWidth: 80, minHeight: 44, padding: '0 16px',
                    border: '1px solid rgba(255,246,237,0.45)', borderRadius: 8,
                    background: 'transparent', color: 'rgba(255,246,237,0.8)',
                    fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                  }}
                >
                  Non
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="font-josefin uppercase"
                  style={{
                    minWidth: 80, minHeight: 44, padding: '0 16px',
                    border: 'none', borderRadius: 8,
                    background: 'var(--color-bordeaux)', color: '#FFF6ED',
                    fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                  }}
                >
                  Oui
                </button>
              </div>
            </>
          ) : (
            /* Petit slot — icônes uniquement */
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                aria-label="Annuler"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '1.5px solid rgba(255,246,237,0.5)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={handleConfirmDelete}
                aria-label="Confirmer la suppression"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: 'none',
                  background: 'var(--color-bordeaux)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path d="M1.5 5.5l4 4 7-8" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
      />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECONDARY_COUNT = 4

function initState(initialData: PortfolioData | null) {
  const cover      = initialData?.images?.find(img => img.is_cover) ?? null
  const secondaries = [...(initialData?.images?.filter(img => !img.is_cover) ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, SECONDARY_COUNT)

  const secondaryPreviews: (string | null)[]     = Array(SECONDARY_COUNT).fill(null)
  const secondaryImageIds: (string | null)[]     = Array(SECONDARY_COUNT).fill(null)

  secondaries.forEach((img, i) => {
    secondaryPreviews[i] = img.url
    secondaryImageIds[i] = img.id
  })

  return {
    coverPreview:    cover?.url  ?? null,
    coverImageId:    cover?.id   ?? null,
    secondaryPreviews,
    secondaryImageIds,
  }
}

// ─── PortfolioStep ────────────────────────────────────────────────────────────

export default function PortfolioStep({
  token,
  vendorType,
  initialData,
  onBack,
  onNext,
}: {
  token: string
  vendorType: VendorType
  initialData: PortfolioData | null
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const init = initState(initialData)

  const [coverPhoto, setCoverPhoto]         = useState<File | null>(null)
  const [coverPreview, setCoverPreview]     = useState<string | null>(init.coverPreview)
  const [coverImageId, setCoverImageId]     = useState<string | null>(init.coverImageId)

  const [secondaryPhotos, setSecondaryPhotos]     = useState<(File | null)[]>(Array(SECONDARY_COUNT).fill(null))
  const [secondaryPreviews, setSecondaryPreviews] = useState<(string | null)[]>(init.secondaryPreviews)
  const [secondaryImageIds, setSecondaryImageIds] = useState<(string | null)[]>(init.secondaryImageIds)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const totalSteps  = vendorType === 'traiteur' ? 7 : 6
  const currentStep = vendorType === 'traiteur' ? 5 : 4

  const hasCover         = coverPreview !== null
  const secondaryFilled  = secondaryPreviews.filter(Boolean).length
  const isDirty          = coverPhoto !== null || secondaryPhotos.some(Boolean)
  const isValid          = hasCover && secondaryFilled === SECONDARY_COUNT

  // ── Handlers cover ──

  function handleCoverUpload(file: File) {
    if (coverPreview && coverPhoto) URL.revokeObjectURL(coverPreview)
    setCoverPhoto(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleCoverDelete(): Promise<boolean> {
    if (coverImageId) {
      const ok = await apiDelete(coverImageId)
      if (!ok) return false
    } else if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverPhoto(null)
    setCoverPreview(null)
    setCoverImageId(null)
    return true
  }

  // ── Handlers secondaires ──

  function handleSecondaryUpload(index: number, file: File) {
    const prev = secondaryPreviews[index]
    if (prev && secondaryPhotos[index]) URL.revokeObjectURL(prev)
    setSecondaryPhotos(prev => { const c = [...prev]; c[index] = file;  return c })
    setSecondaryPreviews(prev => { const c = [...prev]; c[index] = URL.createObjectURL(file); return c })
  }

  async function handleSecondaryDelete(index: number): Promise<boolean> {
    const imageId = secondaryImageIds[index]
    if (imageId) {
      const ok = await apiDelete(imageId)
      if (!ok) return false
    } else {
      const prev = secondaryPreviews[index]
      if (prev) URL.revokeObjectURL(prev)
    }
    setSecondaryPhotos(prev    => { const c = [...prev]; c[index] = null; return c })
    setSecondaryPreviews(prev  => { const c = [...prev]; c[index] = null; return c })
    setSecondaryImageIds(prev  => { const c = [...prev]; c[index] = null; return c })
    return true
  }

  // ── API delete helper ──

  async function apiDelete(imageId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/onboarding/${token}/portfolio/${imageId}`, { method: 'DELETE' })
      return res.ok || res.status === 204
    } catch {
      return false
    }
  }

  // ── Confirm / submit ──

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)

    try {
      if (!isDirty) {
        setSuccess(true)
        setTimeout(() => onNext('legal_info'), 1000)
        return
      }

      const formData = new FormData()
      if (coverPhoto) formData.append('cover_photo', coverPhoto)
      secondaryPhotos.forEach(photo => { if (photo) formData.append('photos[]', photo) })

      const res = await fetch(`/api/onboarding/${token}/portfolio`, { method: 'POST', body: formData })

      if (!res.ok) {
        const json = await res.json()
        setError(Array.isArray(json.errors) ? json.errors[0] : (json.error ?? 'Une erreur est survenue.'))
        return
      }

      const json = await res.json()
      setSuccess(true)
      const nextStep =
        (json.steps as Array<{ status: string; stepKey: string }> | undefined)
          ?.find(s => s.status === 'current')?.stepKey ?? 'legal_info'
      setTimeout(() => onNext(nextStep), 1000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel = submitting ? 'ENVOI…' : success ? '✓ Enregistré' : 'Confirmer →'

  return (
    <div className="min-h-screen bg-creme">
      <div className="max-w-lg mx-auto">

        {/* Header sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-creme)',
          borderBottom: '1px solid rgba(78,26,50,0.094)',
          padding: '20px 32px 16px',
        }}>
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-josefin uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(41,26,16,0.42)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="rgba(41,26,16,0.42)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour
            </button>
            <span className="font-josefin uppercase text-bordeaux" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              Étape {currentStep} / {totalSteps}
            </span>
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        {/* Barre de progression */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`w-8 h-[3px] rounded-full ${i < currentStep ? 'bg-bordeaux' : 'bg-bordeaux/15'}`} />
          ))}
        </div>

        <div style={{ padding: '32px 32px 0' }}>

          <h2
            className="font-cormorant font-light"
            style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', color: '#291A10', lineHeight: 1.3, marginBottom: 20 }}
          >
            Votre travail, <em>en images.</em>
          </h2>

          <div style={{
            background: 'rgba(78,26,50,0.03)', border: '1px solid rgba(78,26,50,0.125)',
            borderRadius: 10, padding: '13px 17px', marginBottom: 28,
          }}>
            <p className="font-cormorant font-light text-texte" style={{ fontSize: 14, lineHeight: 1.8 }}>
              5 photos maximum pour commencer. Vous pourrez en ajouter après validation.<br />
              <span style={{ color: 'rgba(41,26,16,0.5)' }}>Formats acceptés : JPG, PNG, WebP.</span>
            </p>
          </div>

          <p className="font-josefin uppercase text-bordeaux/50" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 12 }}>
            Photo principale — Couverture
          </p>

          <PhotoSlot
            preview={coverPreview}
            savedImageId={coverImageId}
            height={200}
            label={'Ajouter la photo\nde couverture'}
            iconSize={32}
            isCover
            onUpload={handleCoverUpload}
            onDelete={handleCoverDelete}
          />

          <p className="font-cormorant italic" style={{ fontSize: 13, color: '#8C7B6B', marginTop: 8, marginBottom: 28, lineHeight: 1.5 }}>
            Cette photo sera la première vue par les couples.
          </p>

          <p className="font-josefin uppercase text-bordeaux/50" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 12 }}>
            Photos complémentaires
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {[0, 1, 2].map(i => (
              <PhotoSlot
                key={i}
                preview={secondaryPreviews[i]}
                savedImageId={secondaryImageIds[i]}
                height={110}
                label={`Photo ${i + 2}`}
                iconSize={22}
                onUpload={file => handleSecondaryUpload(i, file)}
                onDelete={() => handleSecondaryDelete(i)}
              />
            ))}
          </div>

          <div style={{ width: 'calc(33.33% - 7px)' }}>
            <PhotoSlot
              preview={secondaryPreviews[3]}
              savedImageId={secondaryImageIds[3]}
              height={110}
              label="Photo 5"
              iconSize={22}
              onUpload={file => handleSecondaryUpload(3, file)}
              onDelete={() => handleSecondaryDelete(3)}
            />
          </div>

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          <div style={{ marginTop: 32, paddingBottom: 32 }}>
            <button
              onClick={handleConfirm}
              disabled={!isValid || submitting || success}
              className="w-full font-josefin uppercase text-creme flex items-center justify-center gap-2.5"
              style={{
                padding: '17px 28px', borderRadius: 12, border: 'none',
                fontSize: 13, letterSpacing: '0.1em',
                background: isValid ? 'var(--color-accent)' : 'rgba(78,26,50,0.145)',
                cursor: isValid && !submitting && !success ? 'pointer' : 'default',
                animation: isValid && !submitting && !success ? 'pulse-cta 2.8s ease-in-out 1s infinite' : 'none',
                transition: 'background 0.3s, opacity 0.2s, transform 0.15s',
              }}
            >
              {ctaLabel}
            </button>
            {!isValid && (
              <p className="font-cormorant italic text-center" style={{ fontSize: 13, color: 'rgba(41,26,16,0.4)', marginTop: 10 }}>
                {!hasCover
                  ? 'Ajoutez une photo de couverture pour continuer.'
                  : `${secondaryFilled} / ${SECONDARY_COUNT} photos complémentaires ajoutées.`}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
