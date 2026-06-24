'use client'
import { useRef, useState } from 'react'
import type { OnboardingStep, PortfolioImage } from '../../types'
import type { UsePortfolioUploadReturn } from '@/hooks/usePortfolioUpload'
import CropModal from './CropModal'
import StepBreadcrumb from '../../StepBreadcrumb'

// ─── Types ────────────────────────────────────────────────────────────────────

const SECONDARY_COUNT = 4
const MIN_SECONDARY   = 2

type LocalSlot = {
  localFile:    File   | null
  localPreview: string | null
  originalFile: File   | null
  uploading:    boolean
}

type SlotState = {
  savedId:      string | null
  savedUrl:     string | null
  localFile:    File   | null
  localPreview: string | null
  originalFile: File   | null
  uploading:    boolean
}

const emptyLocal = (): LocalSlot =>
  ({ localFile: null, localPreview: null, originalFile: null, uploading: false })

function toSlot(photo: PortfolioImage | undefined, local: LocalSlot): SlotState {
  return {
    savedId:      photo?.id      ?? null,
    savedUrl:     photo?.url     ?? null,
    localFile:    local.localFile,
    localPreview: local.localPreview,
    originalFile: local.originalFile,
    uploading:    local.uploading,
  }
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  slot:           SlotState
  height:         number | string
  label:          string
  iconSize:       number
  isCover?:       boolean
  disabled?:      boolean
  onFileSelected: (file: File) => void
  onClearLocal:   () => void
  onReCrop:       () => void
  onDelete:       () => Promise<boolean>
}

function PhotoSlot({ slot, height, label, iconSize, isCover = false, disabled = false,
  onFileSelected, onClearLocal, onReCrop, onDelete }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive]               = useState(false)
  const [confirmingDelete, setConfirming] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  const displayPreview = slot.localPreview ?? slot.savedUrl
  const isLocal        = slot.localFile !== null
  const OVERLAY_BG     = 'rgba(41, 26, 16, 0.78)'

  async function handleConfirmDelete() {
    setDeleting(true)
    const ok = await onDelete()
    setDeleting(false)
    if (ok) setConfirming(false)
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style={{ display: 'none' }}
      onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFileSelected(f) }}
    />
  )

  if (!displayPreview) {
    return (
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onMouseEnter={() => !disabled && setActive(true)}
        onMouseLeave={() => setActive(false)}
        onTouchStart={() => !disabled && setActive(true)}
        onTouchEnd={() => setActive(false)}
        style={{
          width: '100%', height, borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? 'var(--color-bordeaux)' : disabled ? 'rgba(78,26,50,0.12)' : 'rgba(78,26,50,0.25)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: iconSize > 24 ? 10 : 6,
          background: active ? 'rgba(78,26,50,0.03)' : 'transparent',
          transform: active ? 'scale(0.98)' : 'scale(1)',
          transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" stroke={disabled ? 'rgba(78,26,50,0.3)' : '#E35704'} strokeWidth="1.2" />
          <path d="M16 10v12M10 16h12" stroke={disabled ? 'rgba(78,26,50,0.3)' : '#E35704'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-josefin uppercase text-center"
          style={{ fontSize: iconSize > 24 ? 11 : 10, letterSpacing: '0.07em', color: 'rgba(78,26,50,0.44)', lineHeight: 1.5, padding: '0 8px', whiteSpace: 'pre-line' }}>
          {label}
        </span>
        {hiddenInput}
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden',
      outline: isLocal && !slot.uploading ? '2.5px solid var(--color-highlight)' : '2.5px solid transparent',
      outlineOffset: '-2px',
      transition: 'outline-color 0.25s',
    }}>
      <img
        src={displayPreview}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: slot.uploading ? 0.55 : 1, transition: 'opacity 0.2s' }}
      />

      {slot.uploading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="11" stroke="rgba(255,246,237,0.3)" strokeWidth="2" />
            <path d="M14 3a11 11 0 0 1 11 11" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {!slot.uploading && !confirmingDelete && !deleting && (
        <>
          {isLocal && slot.originalFile && (
            <button
              onClick={onReCrop}
              aria-label="Recadrer"
              style={{ position: 'absolute', top: 0, left: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(41,26,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h7v7" stroke="#FFF6ED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 1v7h7" stroke="#FFF6ED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          )}
          <button
            onClick={() => isLocal ? onClearLocal() : setConfirming(true)}
            aria-label={isLocal ? 'Annuler la sélection' : 'Supprimer'}
            style={{ position: 'absolute', top: 0, right: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: isLocal ? 'rgba(227,87,4,0.7)' : 'rgba(41,26,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </>
      )}

      {(confirmingDelete || deleting) && (
        <div style={{ position: 'absolute', inset: 0, background: OVERLAY_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isCover ? 16 : 12, borderRadius: 12 }}>
          {deleting ? (
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="rgba(255,246,237,0.25)" strokeWidth="2" />
              <path d="M14 3a11 11 0 0 1 11 11" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : isCover ? (
            <>
              <p className="font-cormorant italic" style={{ fontSize: 15, color: '#FFF6ED', margin: 0 }}>Supprimer ?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirming(false)} className="font-josefin uppercase"
                  style={{ minWidth: 80, minHeight: 44, padding: '0 16px', border: '1px solid rgba(255,246,237,0.45)', borderRadius: 8, background: 'transparent', color: 'rgba(255,246,237,0.8)', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  Non
                </button>
                <button onClick={handleConfirmDelete} className="font-josefin uppercase"
                  style={{ minWidth: 80, minHeight: 44, padding: '0 16px', border: 'none', borderRadius: 8, background: 'var(--color-bordeaux)', color: '#FFF6ED', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  Oui
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirming(false)} aria-label="Annuler"
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,246,237,0.5)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <button onClick={handleConfirmDelete} aria-label="Confirmer la suppression"
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--color-bordeaux)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path d="M1.5 5.5l4 4 7-8" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {hiddenInput}
    </div>
  )
}

// ─── PortfolioUploaderOnboarding ──────────────────────────────────────────────

interface Props extends UsePortfolioUploadReturn {
  steps:          OnboardingStep[]
  currentStepKey: string
  onBack:         () => void
  onNext:         (nextStep: string) => void
  onNavigate:     (stepKey: string) => void
}

export default function PortfolioUploaderOnboarding({
  photos, addPhoto, deletePhoto,
  steps, currentStepKey, onBack, onNext, onNavigate,
}: Props) {
  const [localCover, setLocalCover]           = useState<LocalSlot>(emptyLocal())
  const [localSecondaries, setLocalSecondaries] = useState<LocalSlot[]>(
    Array(SECONDARY_COUNT).fill(null).map(emptyLocal)
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [pendingCrop, setPendingCrop] = useState<{
    file:        File
    prev:        LocalSlot
    apply:       (s: LocalSlot) => void
    aspectRatio: '16:9' | '1:1'
  } | null>(null)

  // ── Derived slot state ──

  const coverPhoto        = photos.find(p => p.is_cover)
  const secondaryPhotos   = photos.filter(p => !p.is_cover).sort((a, b) => a.sort_order - b.sort_order)

  const coverSlot         = toSlot(coverPhoto, localCover)
  const secondarySlots    = Array(SECONDARY_COUNT).fill(null).map((_, i) =>
    toSlot(secondaryPhotos[i], localSecondaries[i])
  )

  // ── Validation ──

  const coverHasContent   = coverPhoto !== null || localCover.localFile !== null
  const secondaryFilled   = secondarySlots.filter(s => s.savedId !== null || s.localFile !== null).length
  const isDirty           = !success && (localCover.localFile !== null || localSecondaries.some(s => s.localFile !== null))
  const isValid           = coverHasContent && secondaryFilled >= MIN_SECONDARY && !submitting

  // ── File selection / crop ──

  function pickFile(
    file: File,
    prev: LocalSlot,
    apply: (s: LocalSlot) => void,
    aspectRatio: '16:9' | '1:1' = '16:9',
  ) {
    setPendingCrop({ file, prev, apply, aspectRatio })
  }

  function handleCropConfirm(croppedFile: File) {
    if (!pendingCrop) return
    const { prev, apply } = pendingCrop
    if (prev.localPreview) URL.revokeObjectURL(prev.localPreview)
    apply({ ...prev, localFile: croppedFile, localPreview: URL.createObjectURL(croppedFile), originalFile: pendingCrop.file })
    setError(null)
    setPendingCrop(null)
  }

  function clearLocal(prev: LocalSlot, apply: (s: LocalSlot) => void) {
    if (prev.localPreview) URL.revokeObjectURL(prev.localPreview)
    apply(emptyLocal())
  }

  // ── Delete (via hook) ──

  async function handleDelete(photoId: string): Promise<boolean> {
    try {
      await deletePhoto(photoId)
      return true
    } catch {
      return false
    }
  }

  // ── Confirmer ──

  async function handleConfirm() {
    if (!isValid || success) return

    const hasCoverLocal   = localCover.localFile !== null
    const hasSecondaryLocal = localSecondaries.some(s => s.localFile !== null)

    if (!hasCoverLocal && !hasSecondaryLocal) {
      setSuccess(true)
      setTimeout(() => onNext('legal_info'), 1000)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Cover en premier
      if (hasCoverLocal) {
        setLocalCover(p => ({ ...p, uploading: true }))
        await addPhoto(localCover.localFile!, true)
        setLocalCover(emptyLocal())
      }

      // 2. Secondaires séquentiellement
      for (let i = 0; i < localSecondaries.length; i++) {
        if (!localSecondaries[i].localFile) continue
        setLocalSecondaries(prev => {
          const c = [...prev]
          c[i] = { ...c[i], uploading: true }
          return c
        })
        await addPhoto(localSecondaries[i].localFile!, false)
        setLocalSecondaries(prev => {
          const c = [...prev]
          c[i] = emptyLocal()
          return c
        })
      }

      setSuccess(true)
      setTimeout(() => onNext('legal_info'), 1000)
    } catch (err) {
      setLocalCover(p => ({ ...p, uploading: false }))
      setLocalSecondaries(prev => prev.map(s => ({ ...s, uploading: false })))
      const msg = (err as Error).message === 'compress_failed'
        ? 'Cette photo est trop volumineuse, veuillez en choisir une autre.'
        : "Une photo n'a pas pu être envoyée. Veuillez réessayer."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel = submitting ? 'Envoi en cours…' : success ? '✓ Enregistré' : 'Confirmer →'

  return (
    <>
    <div className="min-h-screen bg-creme">
      <div className="max-w-lg mx-auto">

        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-creme)', borderBottom: '1px solid rgba(78,26,50,0.094)', padding: '18px 24px 14px' }}>
          <div className="flex items-center justify-between" style={{ minHeight: 18, marginBottom: 14 }}>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-josefin uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(41,26,16,0.42)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="rgba(41,26,16,0.42)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour
            </button>
            {isDirty && (
              <span style={{ color: 'rgb(157,79,30)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 11, fontWeight: 500 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(157,79,30)', flexShrink: 0 }} />
                Modifications non sauvegardées
              </span>
            )}
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        <StepBreadcrumb steps={steps} currentStepKey={currentStepKey} onNavigate={onNavigate} />

        <div style={{ padding: '32px 32px 0' }}>

          <h2 className="font-cormorant font-light"
            style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', color: '#291A10', lineHeight: 1.3, marginBottom: 20 }}>
            Votre travail, <em>en images.</em>
          </h2>

          <div style={{ background: 'rgba(78,26,50,0.03)', border: '1px solid rgba(78,26,50,0.125)', borderRadius: 10, padding: '13px 17px', marginBottom: 28 }}>
            <p className="font-cormorant font-light text-texte" style={{ fontSize: 14, lineHeight: 1.8 }}>
              1 photo de couverture + 2 photos complémentaires minimum. Vous pourrez en ajouter depuis votre tableau de bord.<br />
              <span style={{ color: 'rgba(41,26,16,0.5)' }}>Formats acceptés : JPG, PNG, WebP.</span>
            </p>
          </div>

          <p className="font-josefin uppercase text-bordeaux/50" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 12 }}>
            Photo principale — Couverture
          </p>

          <PhotoSlot
            slot={coverSlot}
            height={200}
            label={'Ajouter la photo\nde couverture'}
            iconSize={32}
            isCover
            onFileSelected={file => pickFile(file, localCover, s => setLocalCover(s))}
            onClearLocal={() => clearLocal(localCover, s => setLocalCover(s))}
            onReCrop={() => { if (localCover.originalFile) pickFile(localCover.originalFile, localCover, s => setLocalCover(s)) }}
            onDelete={async () => {
              if (!coverPhoto) return true
              return handleDelete(coverPhoto.id)
            }}
          />

          <p className="font-cormorant italic" style={{ fontSize: 13, color: '#8C7B6B', marginTop: 8, marginBottom: 28, lineHeight: 1.5 }}>
            Cette photo sera la première vue par les couples.
          </p>

          <p className="font-josefin uppercase text-bordeaux/50" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 12 }}>
            Photos complémentaires
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ aspectRatio: '1 / 1' }}>
                <PhotoSlot
                  slot={secondarySlots[i]}
                  height="100%"
                  label={`Photo ${i + 2}`}
                  iconSize={22}
                  disabled={!coverHasContent}
                  onFileSelected={file => pickFile(file, localSecondaries[i], s => setLocalSecondaries(prev => { const c = [...prev]; c[i] = s; return c }), '1:1')}
                  onClearLocal={() => clearLocal(localSecondaries[i], s => setLocalSecondaries(prev => { const c = [...prev]; c[i] = s; return c }))}
                  onReCrop={() => {
                    const s = localSecondaries[i]
                    if (s.originalFile) pickFile(s.originalFile, s, u => setLocalSecondaries(prev => { const c = [...prev]; c[i] = u; return c }), '1:1')
                  }}
                  onDelete={async () => {
                    if (!secondaryPhotos[i]) return true
                    return handleDelete(secondaryPhotos[i].id)
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ width: 'calc(33.33% - 7px)', aspectRatio: '1 / 1' }}>
            <PhotoSlot
              slot={secondarySlots[3]}
              height="100%"
              label="Photo 5"
              iconSize={22}
              disabled={!coverHasContent}
              onFileSelected={file => pickFile(file, localSecondaries[3], s => setLocalSecondaries(prev => { const c = [...prev]; c[3] = s; return c }), '1:1')}
              onClearLocal={() => clearLocal(localSecondaries[3], s => setLocalSecondaries(prev => { const c = [...prev]; c[3] = s; return c }))}
              onReCrop={() => {
                const s = localSecondaries[3]
                if (s.originalFile) pickFile(s.originalFile, s, u => setLocalSecondaries(prev => { const c = [...prev]; c[3] = u; return c }), '1:1')
              }}
              onDelete={async () => {
                if (!secondaryPhotos[3]) return true
                return handleDelete(secondaryPhotos[3].id)
              }}
            />
          </div>

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          <div style={{ marginTop: 32, paddingBottom: 32 }}>
            <button
              onClick={handleConfirm}
              disabled={!isValid || success}
              className="w-full font-josefin uppercase text-creme flex items-center justify-center gap-2.5"
              style={{
                padding: '17px 28px', borderRadius: 12, border: 'none',
                fontSize: 13, letterSpacing: '0.1em',
                background: isValid ? 'var(--color-accent)' : 'rgba(78,26,50,0.145)',
                cursor: isValid && !success ? 'pointer' : 'default',
                animation: isValid && !success ? 'pulse-cta 2.8s ease-in-out 1s infinite' : 'none',
                transition: 'background 0.3s, opacity 0.2s',
              }}
            >
              {ctaLabel}
            </button>
            {!isValid && !submitting && (
              <p className="font-cormorant italic text-center" style={{ fontSize: 13, color: 'rgba(41,26,16,0.4)', marginTop: 10 }}>
                {!coverHasContent
                  ? 'Ajoutez une photo de couverture pour continuer.'
                  : `${secondaryFilled} / ${MIN_SECONDARY} photos complémentaires ajoutées.`}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>

    {pendingCrop && (
      <CropModal
        file={pendingCrop.file}
        aspectRatio={pendingCrop.aspectRatio}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingCrop(null)}
      />
    )}
    </>
  )
}
