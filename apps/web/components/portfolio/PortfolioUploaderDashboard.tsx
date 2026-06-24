'use client'
import { useRef, useState } from 'react'
import type { UsePortfolioUploadReturn } from '@/hooks/usePortfolioUpload'

interface Props extends UsePortfolioUploadReturn {
  maxPhotos: number
}

export default function PortfolioUploaderDashboard({ photos, addPhoto, deletePhoto, setCover, isUploading, count, isFull, maxPhotos }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const coverPhoto      = photos.find(p => p.is_cover)
  const secondaryPhotos = photos.filter(p => !p.is_cover).sort((a, b) => a.sort_order - b.sort_order)
  const remaining       = maxPhotos - count

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLocalError(null)
    try {
      await addPhoto(file, count === 0)  // first photo becomes cover automatically
    } catch (err) {
      const msg = (err as Error).message === 'compress_failed'
        ? 'Cette photo est trop volumineuse, veuillez en choisir une autre.'
        : "L'upload a échoué. Veuillez réessayer."
      setLocalError(msg)
    }
  }

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />
  )

  // ── État vide ──────────────────────────────────────────────────────────────

  if (count === 0) {
    return (
      <div>
        {hiddenInput}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'var(--color-bordeaux)',
            borderRadius: 16,
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            cursor: isUploading ? 'default' : 'pointer',
            opacity: isUploading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {isUploading ? (
            <svg className="animate-spin" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="18" stroke="rgba(255,246,237,0.3)" strokeWidth="2.5" />
              <path d="M22 4a18 18 0 0 1 18 18" stroke="#FFF6ED" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px solid rgba(255,246,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V8M8 12l4-4 4 4" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,246,237,0.6)', marginBottom: 8 }}>
              IMPORTER
            </p>
            <p className="font-cormorant" style={{ fontSize: 28, color: '#FFF6ED', lineHeight: 1.3, marginBottom: 4 }}>
              Glissez vos photos ici,<br />
              <em style={{ color: 'var(--color-accent)' }}>ou cliquez pour parcourir.</em>
            </p>
            <p style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 12, color: 'rgba(255,246,237,0.5)', marginTop: 12 }}>
              {maxPhotos} photos max · JPG, PNG, HEIC · 12 Mo max par fichier · compression auto côté navigateur.
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
            disabled={isUploading}
            className="font-josefin uppercase"
            style={{ marginTop: 8, padding: '12px 28px', borderRadius: 8, border: '1.5px solid rgba(255,246,237,0.6)', background: 'transparent', color: '#FFF6ED', fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer' }}
          >
            PARCOURIR MES FICHIERS
          </button>
        </div>

        <div style={{ marginTop: 16, padding: '13px 17px', background: 'rgba(78,26,50,0.03)', border: '1px solid rgba(78,26,50,0.1)', borderRadius: 10 }}>
          <p className="font-cormorant italic" style={{ fontSize: 14, color: '#8C7B6B', lineHeight: 1.7, margin: 0 }}>
            <span style={{ color: 'var(--color-bordeaux)', marginRight: 6 }}>·</span>
            Aucune photo pour l&apos;instant — la première que vous importerez deviendra automatiquement la{' '}
            <span style={{ color: 'var(--color-accent)' }}>couverture</span>.
            {' '}Vous pourrez la changer à tout moment.
          </p>
        </div>
      </div>
    )
  }

  // Tous les emplacements secondaires (remplis + vides) jusqu'à maxPhotos - 1
  const secondarySlots = Array(maxPhotos - 1).fill(null).map((_, i) => secondaryPhotos[i] ?? null)

  // ── Avec photos ────────────────────────────────────────────────────────────

  return (
    <div>
      {hiddenInput}

      {/* En-tête compteur + bouton */}
      <div className="flex items-center justify-between" style={{ gap: 12, marginBottom: 20 }}>
        <div>
          <span className="font-cormorant" style={{ fontSize: 28, color: '#291A10', whiteSpace: 'nowrap' }}>
            {count} / {maxPhotos}
            <span className="hidden md:inline"> photos</span>
          </span>
          {/* Hint "cliquez" — desktop seulement */}
          {count > 0 && (
            <p className="hidden md:block" style={{ fontFamily: 'var(--font-manrope-var, Manrope, system-ui, sans-serif)', fontSize: 12, color: 'rgba(41,26,16,0.45)', marginTop: 2 }}>
              · cliquez sur une vignette pour la mettre en couverture
            </p>
          )}
        </div>

        {!isFull && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 bg-bordeaux text-creme rounded-full text-[11px] tracking-[0.1em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-manrope-var)' }}
          >
            {isUploading ? (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="rgba(255,246,237,0.35)" strokeWidth="2" />
                <path d="M8 2a6 6 0 0 1 6 6" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
            + AJOUTER ({remaining} RESTANTE{remaining > 1 ? 'S' : ''})
          </button>
        )}
      </div>

      {/* Layout responsive :
            mobile  → cover pleine largeur + vignettes 3 colonnes dessous
            desktop → cover (3fr) | vignettes grille 2 col (2fr) côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr]" style={{ gap: 12, alignItems: 'start' }}>

        {/* Cover */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '3 / 4' }}>
          {coverPhoto ? (
            <>
              <img
                src={coverPhoto.url}
                alt="Couverture"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <span className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: '#FFF6ED', background: 'rgba(78,26,50,0.85)', padding: '4px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  ★ COUVERTURE
                  <span style={{ opacity: 0.6 }}>01</span>
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 14px 14px', background: 'linear-gradient(to top, rgba(41,26,16,0.6) 0%, transparent 100%)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'rgba(78,26,50,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isUploading && (
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="11" stroke="rgba(78,26,50,0.2)" strokeWidth="2" />
                  <path d="M14 3a11 11 0 0 1 11 11" stroke="var(--color-bordeaux)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Vignettes : tous les emplacements (remplis + vides), 3 col mobile, 2 col desktop */}
        <div className="grid grid-cols-3 md:grid-cols-2" style={{ gap: 8 }}>
          {secondarySlots.map((photo, i) =>
            photo ? (
              /* Emplacement rempli */
              <div
                key={photo.id}
                onClick={() => setCover(photo.id)}
                style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 1', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.97)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${i + 2}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="font-josefin" style={{ position: 'absolute', top: 6, left: 8, fontSize: 10, color: 'rgba(255,246,237,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  {String(i + 2).padStart(2, '0')}
                </span>
                <DeleteButton onDelete={() => deletePhoto(photo.id)} />
              </div>
            ) : (
              /* Emplacement vide */
              <div
                key={`empty-${i}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{
                  aspectRatio: '1 / 1', borderRadius: 8,
                  border: '1.5px dashed rgba(78,26,50,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 5, cursor: isUploading ? 'default' : 'pointer',
                  background: 'rgba(78,26,50,0.015)',
                }}
              >
                <span className="font-josefin" style={{ fontSize: 10, color: 'rgba(78,26,50,0.25)', letterSpacing: '0.04em' }}>
                  {String(i + 2).padStart(2, '0')}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="rgba(227,87,4,0.45)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            )
          )}
        </div>
      </div>

      {localError && (
        <p className="font-josefin text-sm text-highlight text-center" style={{ marginTop: 12 }}>{localError}</p>
      )}
    </div>
  )
}

// ── Bouton suppression vignette ──────────────────────────────────────────────

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  if (deleting) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(41,26,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="rgba(255,246,237,0.3)" strokeWidth="2" />
          <path d="M10 2a8 8 0 0 1 8 8" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (confirming) {
    return (
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(41,26,16,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setConfirming(false)}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,246,237,0.5)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={async () => { setDeleting(true); onDelete() }}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--color-bordeaux)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="#FFF6ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setConfirming(true) }}
      aria-label="Supprimer"
      style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(41,26,16,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="#FFF6ED" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  )
}
