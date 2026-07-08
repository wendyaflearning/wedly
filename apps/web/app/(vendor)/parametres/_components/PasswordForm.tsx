'use client'

import { useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { apiFetch } from '@/lib/fetchClient'

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast, showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiFetch('/api/vendors/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirmation }),
      })
      showToast('success', 'Mot de passe modifié ✓')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />
      <form onSubmit={handleSubmit} className="py-4 border-b border-bordeaux/10">
        <div className="mb-4">
          <p className="text-[13px] font-medium text-texte">Mot de passe</p>
          <p className="text-[12px] text-gris mt-0.5">Modifiez votre mot de passe de connexion</p>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggleShow={() => setShowCurrent(v => !v)} />
          <Field label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} show={showNew} onToggleShow={() => setShowNew(v => !v)} />
          <Field label="Confirmer le nouveau mot de passe" value={newPasswordConfirmation} onChange={setNewPasswordConfirmation} show={showConfirm} onToggleShow={() => setShowConfirm(v => !v)} />
          <div className="flex justify-end mt-1">
            <button
              type="submit"
              disabled={submitting}
              className="bg-bordeaux text-creme text-[11px] font-semibold tracking-[0.1em] uppercase px-5 py-2.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium tracking-[0.12em] uppercase text-gris mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          className="w-full border border-bordeaux/20 rounded px-3.5 py-3 pr-10 text-sm text-texte bg-creme focus:outline-none focus:border-bordeaux/40"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Masquer' : 'Afficher'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gris/50 hover:text-gris transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3" />
            {!show && <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
    </div>
  )
}
