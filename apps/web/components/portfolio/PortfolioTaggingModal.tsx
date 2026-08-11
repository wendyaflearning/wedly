'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, X } from 'lucide-react'
import { classifyTagSelection, mergeTagSelection, type TagType } from '@/lib/portfolio-tags'

interface PortfolioTaggingModalProps {
  photoUrl: string
  serviceLabel: string
  tagTypes: TagType[]
  tagTypesLoading?: boolean
  tagTypesError?: string | null
  initialTagValueIds: string[]
  queuePosition: number
  queueTotal: number
  onConfirm: (tagValueIds: string[]) => Promise<void>
  onCancel: () => Promise<void>
  theme?: 'light' | 'dark'
}

export function PortfolioTaggingModal({
  photoUrl,
  serviceLabel,
  tagTypes,
  tagTypesLoading,
  tagTypesError,
  initialTagValueIds,
  queuePosition,
  queueTotal,
  onConfirm,
  onCancel,
  theme = 'light',
}: PortfolioTaggingModalProps) {
  const isDark = theme === 'dark'
  const [{ primaryId, optionalIds }, setSelection] = useState(() =>
    classifyTagSelection(tagTypes, initialTagValueIds)
  )
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = submitting || cancelling
  const isLastInQueue = queuePosition === queueTotal

  const primaryTagType = tagTypes.find((t) => t.isPrimary)
  const optionalTagTypes = tagTypes.filter((t) => !t.isPrimary)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void handleCancel()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectPrimary(id: string) {
    setSelection((prev) => ({ ...prev, primaryId: id }))
  }

  function toggleOptional(tagType: TagType, id: string) {
    setSelection((prev) => {
      if (prev.optionalIds.includes(id)) {
        return { ...prev, optionalIds: prev.optionalIds.filter((v) => v !== id) }
      }
      if (tagType.maxSelections !== null) {
        const countInGroup = prev.optionalIds.filter((v) =>
          tagType.tagValues.some((tv) => tv.id === v)
        ).length
        if (countInGroup >= tagType.maxSelections) return prev
      }
      return { ...prev, optionalIds: [...prev.optionalIds, id] }
    })
  }

  async function handleConfirm() {
    if (primaryId === null || busy || tagTypesLoading) return

    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(mergeTagSelection(primaryId, optionalIds))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La mise à jour des tags a échoué.')
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (busy) return
    setCancelling(true)
    setError(null)
    try {
      await onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'annulation a échoué.")
      setCancelling(false)
    }
  }

  function renderTagValueChip(
    id: string,
    label: string,
    selected: boolean,
    disabled: boolean,
    onClick: () => void,
    size: 'md' | 'sm' = 'md'
  ) {
    const darkSelectedBg = size === 'md' ? '#E35704' : 'rgba(227,87,4,0.18)'
    return (
      <button
        key={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-full border font-manrope font-medium transition-colors disabled:cursor-not-allowed ${
          size === 'md' ? 'px-3.5 py-1.5 text-[13px]' : 'px-3 py-1 text-[12px]'
        } ${
          isDark
            ? ''
            : selected
              ? 'border-bordeaux bg-bordeaux text-creme'
              : disabled
                ? 'border-[#eaded2] bg-white text-texte/30'
                : 'border-[#eaded2] bg-white text-texte hover:border-bordeaux/40'
        }`}
        style={
          isDark
            ? {
                borderColor: selected ? '#E35704' : 'rgba(255,246,237,0.3)',
                background: selected ? darkSelectedBg : 'transparent',
                color: disabled ? 'rgba(255,246,237,0.3)' : selected ? '#FFF6ED' : 'rgba(255,246,237,0.85)',
              }
            : undefined
        }
      >
        {label}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-texte/40 p-0 md:p-8">
      <div className="absolute inset-0" onClick={() => void handleCancel()} />

      <div
        role="dialog"
        aria-modal="true"
        className={`modal-enter relative z-10 flex h-full w-full flex-col overflow-hidden shadow-2xl md:h-auto md:max-h-[88vh] md:w-[min(1120px,94vw)] md:flex-row md:rounded-[20px] ${
          isDark ? '' : 'bg-creme'
        }`}
        style={isDark ? { background: 'rgba(46,18,32,0.94)' } : undefined}
      >
        {/* Volet photo */}
        <div
          className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden md:aspect-auto md:h-auto md:w-[55%] md:flex-1 ${
            isDark ? 'bg-black' : 'bg-[#f7f3ee]'
          }`}
        >
          <Image src={photoUrl} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" unoptimized />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-texte/50 to-transparent" />
          <p className="absolute bottom-4 left-5 font-manrope text-[10px] font-medium tracking-[0.18em] text-creme/90 uppercase">
            {queuePosition} / {queueTotal}
          </p>
          {cancelling && (
            <div className="absolute inset-0 flex items-center justify-center bg-texte/40">
              <Loader2 size={28} className="animate-spin text-creme" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Volet formulaire */}
        <div className="flex min-h-0 flex-1 flex-col md:w-[420px] md:flex-none">
          <div className="shrink-0 px-6 pt-5 pb-4 md:px-8 md:pt-7">
            <div className="flex items-center justify-between gap-3">
              <span
                className="font-manrope text-[11px] font-medium tracking-[0.22em] uppercase"
                style={{ color: isDark ? 'rgba(255,246,237,0.5)' : 'var(--color-accent)' }}
              >
                Tagging portfolio · {serviceLabel.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={busy}
                aria-label="Annuler"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDark ? '' : 'text-texte/60 hover:bg-texte/5'
                }`}
                style={isDark ? { background: 'rgba(255,246,237,0.12)', color: '#FFF6ED' } : undefined}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div
              className={`mt-3.5 h-[3px] w-full rounded-full ${isDark ? '' : 'bg-bordeaux/10'}`}
              style={isDark ? { background: 'rgba(255,246,237,0.15)' } : undefined}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${isDark ? '' : 'bg-accent'}`}
                style={{ width: `${(queuePosition / queueTotal) * 100}%`, background: isDark ? '#E35704' : undefined }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 md:px-8">
            {tagTypesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={28} className="animate-spin" style={{ color: isDark ? 'rgba(255,246,237,0.5)' : undefined }} aria-hidden="true" />
              </div>
            ) : tagTypesError ? (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{tagTypesError}</p>
            ) : (
              <>
                {primaryTagType && (
                  <div className="mb-5">
                    <span
                      className="mb-2 block font-manrope text-[11px] font-medium tracking-[0.22em] uppercase"
                      style={{ color: isDark ? '#E8A87C' : 'var(--color-accent)' }}
                    >
                      Tag obligatoire · Filtrable
                    </span>
                    <fieldset disabled={busy}>
                      <legend
                        className="mb-2 font-cormorant italic text-xl"
                        style={{ color: isDark ? '#FFF6ED' : 'var(--color-bordeaux)' }}
                      >
                        {primaryTagType.label}
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {primaryTagType.tagValues.map((tv) =>
                          renderTagValueChip(tv.id, tv.label, primaryId === tv.id, false, () => selectPrimary(tv.id))
                        )}
                      </div>
                    </fieldset>
                  </div>
                )}

                {optionalTagTypes.length > 0 && (
                  <div
                    className={`pt-5 ${isDark ? '' : 'border-t border-bordeaux/10'}`}
                    style={isDark ? { borderTop: '1px solid rgba(255,246,237,0.12)' } : undefined}
                  >
                    <span
                      className="mb-4 block font-manrope text-[11px] font-medium tracking-[0.22em] uppercase"
                      style={{ color: isDark ? 'rgba(255,246,237,0.45)' : 'var(--color-accent)' }}
                    >
                      Tags optionnels · Alimentent la fiche
                    </span>
                    {optionalTagTypes.map((tagType) => {
                      const countInGroup = optionalIds.filter((v) =>
                        tagType.tagValues.some((tv) => tv.id === v)
                      ).length
                      return (
                        <fieldset key={tagType.id} className="mb-4 last:mb-0" disabled={busy}>
                          <legend
                            className="mb-2 font-manrope text-sm font-semibold"
                            style={{ color: isDark ? 'rgba(255,246,237,0.7)' : 'var(--color-texte)' }}
                          >
                            {tagType.label}
                          </legend>
                          <div className="flex flex-wrap gap-1.5">
                            {tagType.tagValues.map((tv) => {
                              const selected = optionalIds.includes(tv.id)
                              const disabled =
                                !selected && tagType.maxSelections !== null && countInGroup >= tagType.maxSelections
                              return renderTagValueChip(
                                tv.id,
                                tv.label,
                                selected,
                                disabled,
                                () => toggleOptional(tagType, tv.id),
                                'sm'
                              )
                            })}
                          </div>
                        </fieldset>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className={`shrink-0 px-6 py-5 md:px-8 ${isDark ? '' : 'border-t border-bordeaux/10'}`}
            style={isDark ? { borderTop: '1px solid rgba(255,246,237,0.12)' } : undefined}
          >
            {error && (
              <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={primaryId === null || busy || tagTypesLoading}
              className={`w-full rounded-xl px-4 py-3.5 font-manrope text-[11px] font-semibold tracking-[0.18em] uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
                isDark ? 'text-[#FFF6ED]' : 'bg-bordeaux text-creme'
              }`}
              style={
                isDark
                  ? { background: 'linear-gradient(135deg,#E35704,#F58324)', boxShadow: '0 14px 32px rgba(227,87,4,0.42)' }
                  : undefined
              }
            >
              {submitting ? 'Enregistrement…' : isLastInQueue ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
