'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronRight, Loader2, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'

const MAX_SPECIALTIES = 2

type TagOption = { id: string; name: string; slug: string }
type SpecialtyTagOption = TagOption & { serviceId: string }

interface PortfolioTaggingModalProps {
  photoUrl: string
  styleOptions: TagOption[]
  specialtyOptions: SpecialtyTagOption[]
  allowedServiceId: string | null
  groupLabels?: Record<string, string>
  initialStyleIds: string[]
  initialSpecialtyIds: string[]
  queueLabel?: string
  onConfirm: (styleIds: string[], specialtyIds: string[]) => Promise<void>
  onCancel: () => Promise<void>
}

export function PortfolioTaggingModal({
  photoUrl,
  styleOptions,
  specialtyOptions,
  allowedServiceId,
  groupLabels,
  initialStyleIds,
  initialSpecialtyIds,
  queueLabel,
  onConfirm,
  onCancel,
}: PortfolioTaggingModalProps) {
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(initialStyleIds)
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>(initialSpecialtyIds)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>()
    for (const specialty of specialtyOptions) {
      if (initialSpecialtyIds.includes(specialty.id)) groups.add(specialty.serviceId)
    }
    return groups
  })

  const busy = submitting || cancelling

  const visibleSpecialtyOptions = allowedServiceId
    ? specialtyOptions.filter((specialty) => specialty.serviceId === allowedServiceId)
    : specialtyOptions

  const groupedSpecialtyOptions = useMemo(() => {
    const groups = new Map<string, SpecialtyTagOption[]>()
    for (const specialty of specialtyOptions) {
      const list = groups.get(specialty.serviceId)
      if (list) list.push(specialty)
      else groups.set(specialty.serviceId, [specialty])
    }
    return Array.from(groups.entries())
  }, [specialtyOptions])

  function toggleStyle(id: string) {
    setSelectedStyleIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function toggleSpecialty(id: string) {
    setSelectedSpecialtyIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id)
      if (prev.length >= MAX_SPECIALTIES) return prev
      return [...prev, id]
    })
  }

  function toggleGroup(serviceId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) next.delete(serviceId)
      else next.add(serviceId)
      return next
    })
  }

  async function handleConfirm() {
    if (busy || selectedSpecialtyIds.length === 0) return

    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(selectedStyleIds, selectedSpecialtyIds)
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

  function renderSpecialtyChip(specialty: SpecialtyTagOption) {
    const selected = selectedSpecialtyIds.includes(specialty.id)
    const disabled = !selected && selectedSpecialtyIds.length >= MAX_SPECIALTIES
    return (
      <button
        key={specialty.id}
        type="button"
        onClick={() => toggleSpecialty(specialty.id)}
        disabled={disabled}
        className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed ${
          selected
            ? 'border-bordeaux bg-bordeaux text-creme'
            : disabled
              ? 'border-[#eaded2] bg-white text-texte/30'
              : 'border-[#eaded2] bg-white text-texte hover:border-bordeaux/40'
        }`}
      >
        {specialty.name}
      </button>
    )
  }

  return (
    <BottomSheet
      isOpen
      onClose={handleCancel}
      header={
        <div className="flex items-center justify-between px-6 pt-2 sm:px-8">
          {queueLabel ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-texte/50">{queueLabel}</span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            aria-label="Annuler"
            className="flex h-8 w-8 items-center justify-center rounded-full text-texte/60 hover:bg-texte/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      }
      footer={
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          {error && (
            <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedSpecialtyIds.length === 0 || busy}
            className="w-full rounded-lg bg-bordeaux px-4 py-3 text-sm font-semibold text-creme transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      }
    >
      <div className="px-6 py-4 sm:px-8">
        <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#f7f3ee]">
          <Image src={photoUrl} alt="" fill sizes="(min-width: 768px) 480px, 90vw" className="object-cover" unoptimized />
          {cancelling && (
            <div className="absolute inset-0 flex items-center justify-center bg-texte/40">
              <Loader2 size={28} className="animate-spin text-creme" aria-hidden="true" />
            </div>
          )}
        </div>

        <fieldset className="mb-5" disabled={busy}>
          <legend className="mb-2 text-sm font-semibold text-texte">Style</legend>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => {
              const selected = selectedStyleIds.includes(style.id)
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? 'border-bordeaux bg-bordeaux text-creme'
                      : 'border-[#eaded2] bg-white text-texte hover:border-bordeaux/40'
                  }`}
                >
                  {style.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        {allowedServiceId ? (
          <fieldset className="mb-1" disabled={busy}>
            <legend className="mb-2 text-sm font-semibold text-texte">Spécialité</legend>
            <div className="flex flex-wrap gap-2">
              {visibleSpecialtyOptions.map((specialty) => renderSpecialtyChip(specialty))}
            </div>
          </fieldset>
        ) : (
          groupedSpecialtyOptions.map(([serviceId, specialties]) => {
            const isExpanded = expandedGroups.has(serviceId)
            return (
              <fieldset key={serviceId} className="mb-4 last:mb-1" disabled={busy}>
                <legend className="mb-2 w-full">
                  <button
                    type="button"
                    onClick={() => toggleGroup(serviceId)}
                    className="flex w-full items-center gap-1.5 text-sm font-semibold text-texte disabled:cursor-not-allowed"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                    {groupLabels?.[serviceId] ?? 'Autre'}
                  </button>
                </legend>
                {isExpanded && (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => renderSpecialtyChip(specialty))}
                  </div>
                )}
              </fieldset>
            )
          })
        )}
      </div>
    </BottomSheet>
  )
}
