'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AdminTagTypeWithValues } from '@/lib/admin-types'

export type TagTypeFormValues = {
  label: string
  isPrimary: boolean
  maxSelections: number
}

export function TagTypeModal({
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  initial: AdminTagTypeWithValues | null
  onCancel: () => void
  onSubmit: (values: TagTypeFormValues) => Promise<{ ok: true } | { ok: false; error: string }>
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [isPrimary, setIsPrimary] = useState(initial?.isPrimary ?? false)
  const [maxSelections, setMaxSelections] = useState(initial?.maxSelections ?? 1)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit() {
    const trimmed = label.trim()
    if (!trimmed) {
      setError('Le nom de la catégorie est requis.')
      return
    }

    setPending(true)
    setError(null)
    const result = await onSubmit({
      label: trimmed,
      isPrimary,
      maxSelections: Math.max(1, Number(maxSelections) || 1),
    })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-texte/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[460px] flex-col rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between px-7 pt-6">
          <h2 className="font-cormorant text-[26px] font-semibold leading-tight text-bordeaux">
            {mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="-mt-0.5 rounded-md p-1 text-texte/35 hover:text-texte"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mx-7 mb-5 mt-2.5 text-sm text-texte/50">
          {mode === 'create'
            ? 'Ajoute une catégorie de tags pour ce métier.'
            : 'Mets à jour les informations de cette catégorie.'}
        </p>

        <div className="flex flex-col gap-5 px-7">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-texte">Nom de la catégorie</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex. Ambiance musicale"
              className="rounded-md border border-texte/18 bg-creme px-3.5 py-2.5 text-sm text-texte outline-none focus:border-accent"
            />
          </label>

          {mode === 'create' ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-texte">Catégorie principale</span>
                <button
                  type="button"
                  onClick={() => setIsPrimary((value) => !value)}
                  aria-pressed={isPrimary}
                  className={`relative h-[22px] w-10 flex-shrink-0 rounded-full transition-colors ${
                    isPrimary ? 'bg-accent' : 'bg-texte/15'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                      isPrimary ? 'translate-x-[18px]' : ''
                    }`}
                  />
                </button>
              </div>
              <span className="text-xs text-texte/45">
                Une seule catégorie principale possible par métier.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-md bg-creme px-3.5 py-2.5">
              <span className="text-sm font-bold text-texte">Catégorie principale</span>
              <span className="text-xs font-semibold text-texte/50">
                {initial?.isPrimary ? 'Oui' : 'Non'} — modifiable uniquement à la création
              </span>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-texte">Sélection max. par photo</span>
            <input
              type="number"
              min={1}
              value={maxSelections}
              onChange={(event) => setMaxSelections(Number(event.target.value))}
              className="w-[120px] rounded-md border border-texte/18 bg-creme px-3.5 py-2.5 text-sm text-texte outline-none focus:border-accent"
            />
          </label>

          {error && (
            <p className="rounded-md bg-danger-soft px-3 py-2.5 text-xs font-semibold leading-relaxed text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-texte/8 px-7 py-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-texte/20 px-5 py-2.5 text-sm font-semibold text-texte/70 hover:border-texte/40 hover:text-texte"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="rounded-md border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
