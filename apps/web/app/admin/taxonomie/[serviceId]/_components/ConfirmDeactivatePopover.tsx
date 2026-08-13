'use client'

export function ConfirmDeactivatePopover({
  label,
  pronoun = 'Elle',
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  label: string
  pronoun?: string
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="w-80 rounded-lg border border-bordeaux/10 bg-white p-4 shadow-lg">
      <p className="mb-4 text-sm leading-relaxed text-texte">
        Désactiver {label} ? {pronoun} disparaîtra des choix futurs mais restera sur les photos existantes.
      </p>
      {error && <p className="mb-3 text-xs font-semibold text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-texte/20 px-4 py-2 text-sm font-semibold text-texte/70 hover:border-texte/40 hover:text-texte"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Désactivation...' : 'Désactiver'}
        </button>
      </div>
    </div>
  )
}
