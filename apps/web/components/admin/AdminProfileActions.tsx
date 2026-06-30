'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { AdminVendorProfile, RejectionReasonKey } from '@/lib/admin-types'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'

const REJECTION_REASONS: Array<{ key: RejectionReasonKey; label: string }> = [
  { key: 'portfolio_quality', label: 'Portfolio insuffisant ou de mauvaise qualité' },
  { key: 'legal_incomplete', label: 'Informations légales incomplètes ou non conformes' },
  { key: 'pricing_zones_incomplete', label: 'Zones ou tarifs mal renseignés' },
  { key: 'description_insufficient', label: 'Description du profil insuffisante' },
  { key: 'other', label: 'Autre' },
]

export function AdminProfileActions({ profile }: { profile: AdminVendorProfile }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<RejectionReasonKey[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState<'validate' | 'reject' | null>(null)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)

  const actionsEnabled = profile.status === 'under_review'
  const otherSelected = selectedReasons.includes('other')

  async function validateProfile() {
    if (!actionsEnabled || submitting) return
    if (!window.confirm('Valider ce profil prestataire ?')) return

    setSubmitting('validate')
    setValidateError(null)

    const response = await fetch(`/api/admin/vendors/${profile.id}/validate`, { method: 'POST' })
    if (!response.ok) {
      setValidateError("La validation n'a pas abouti. Le statut n'a pas été modifié.")
      setSubmitting(null)
      return
    }

    router.push('/admin/prestataires?toast=validated')
    router.refresh()
  }

  async function rejectProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionsEnabled || submitting) return

    if (selectedReasons.length === 0) {
      setRejectError('Sélectionne au moins un motif de refus.')
      return
    }

    setSubmitting('reject')
    setRejectError(null)

    const response = await fetch(`/api/admin/vendors/${profile.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reasons: selectedReasons,
        note: otherSelected ? note.trim() || null : null,
      }),
    })

    if (!response.ok) {
      setRejectError("Le refus n'a pas abouti. Le statut n'a pas été modifié.")
      setSubmitting(null)
      return
    }

    router.push('/admin/prestataires?toast=rejected')
    router.refresh()
  }

  function toggleReason(reason: RejectionReasonKey) {
    setSelectedReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]
    )
    if (reason === 'other' && otherSelected) {
      setNote('')
    }
  }

  return (
    <>
      <div className="sticky top-[65px] z-30 mb-5 rounded-lg border border-[#e3d7cb] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <AdminStatusBadge status={profile.status} label={profile.statusLabel} />
            <span className="text-sm font-semibold text-texte/65">{profile.summary.brandName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={validateProfile}
              disabled={!actionsEnabled || submitting !== null}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#286342] px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CheckCircle2 size={17} aria-hidden="true" />
              {submitting === 'validate' ? 'Validation...' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!actionsEnabled) return
                setRejectError(null)
                setModalOpen(true)
              }}
              disabled={!actionsEnabled || submitting !== null}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#8a2f2f] px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
            >
              <XCircle size={17} aria-hidden="true" />
              Refuser
            </button>
          </div>
        </div>
        {validateError && (
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-[#df9b9b] bg-[#fff0f0] px-3 py-3 text-sm text-[#8a2f2f] md:flex-row md:items-center md:justify-between">
            <span>{validateError}</span>
            <button type="button" onClick={validateProfile} className="font-semibold underline underline-offset-2">
              Réessayer
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 px-4 py-4 md:items-center md:justify-center">
          <form onSubmit={rejectProfile} className="w-full rounded-lg bg-white p-5 shadow-xl md:max-w-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-cormorant text-3xl font-semibold text-bordeaux">Refuser le profil</h2>
                <p className="mt-1 text-sm text-texte/65">{profile.summary.brandName}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e3d7cb] text-texte"
                aria-label="Fermer"
              >
                <XCircle size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason.key}
                  className="flex items-start gap-3 rounded-md border border-[#eaded2] px-3 py-3 text-sm text-texte"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason.key)}
                    onChange={() => toggleReason(reason.key)}
                    className="mt-0.5 h-4 w-4 accent-bordeaux"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>

            {otherSelected && (
              <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-texte">
                Précision
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="resize-none rounded-md border border-[#d8c9ba] px-3 py-2 text-sm font-normal outline-none focus:border-bordeaux"
                />
              </label>
            )}

            {rejectError && <p className="mt-4 text-sm font-semibold text-[#8a2f2f]">{rejectError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-10 rounded-md border border-[#d8c9ba] px-4 text-sm font-semibold text-texte"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting !== null}
                className="h-10 rounded-md bg-[#8a2f2f] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting === 'reject' ? 'Refus...' : 'Confirmer le refus'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
