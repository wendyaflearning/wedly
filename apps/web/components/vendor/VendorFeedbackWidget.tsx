'use client'

import { useState } from 'react'
import { CircleHelp, Send, X } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { validateVendorFeedbackMessage } from '@/components/vendor/vendor-feedback'

type Props = {
  vendorId: string
}

export function VendorFeedbackWidget({ vendorId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast, showToast } = useToast()
  const textareaId = 'vendor-feedback-message'

  async function handleSubmit() {
    const nextError = validateVendorFeedbackMessage(message)
    setError(nextError)

    if (nextError) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/vendors/${vendorId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Impossible d’envoyer votre message pour le moment.')
      }

      setMessage('')
      setError(null)
      setIsOpen(false)
      showToast('success', 'Votre message a bien été envoyé.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Impossible d’envoyer votre message pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />

      {isOpen ? (
        <section className="fixed inset-x-4 bottom-28 z-50 rounded-[28px] border border-bordeaux/15 bg-creme p-5 shadow-[0_18px_60px_rgba(78,26,50,0.18)] md:inset-x-auto md:right-8 md:bottom-8 md:w-[420px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
                Contact Wedly
              </p>
              <h2 className="mt-2 font-cormorant text-[28px] leading-none text-bordeaux">
                Un doute, un bug, une idée ?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bordeaux/15 text-bordeaux transition-colors hover:bg-bordeaux/5"
              aria-label="Fermer le formulaire de feedback"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mt-3 text-sm leading-6 text-texte/65">
            Envoyez votre retour directement à l’équipe Wedly depuis votre espace prestataire.
          </p>

          <label htmlFor={textareaId} className="mt-5 block">
            <span className="mb-2 block font-manrope text-[12px] font-semibold uppercase tracking-[0.12em] text-bordeaux/70">
              Votre message
            </span>
            <textarea
              id={textareaId}
              value={message}
              onChange={event => {
                setMessage(event.target.value)
                if (error) setError(null)
              }}
              rows={6}
              maxLength={5000}
              placeholder="Décrivez votre retour ou le problème rencontré."
              className="min-h-[150px] w-full resize-y rounded-[22px] border border-bordeaux/15 bg-white px-4 py-3 font-manrope text-sm leading-6 text-texte outline-none transition-colors placeholder:text-texte/35 focus:border-accent"
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-texte/45">
              {message.length}/5000 caractères
            </p>
            {error ? <p className="text-right text-xs text-highlight">{error}</p> : null}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-manrope text-[13px] font-semibold tracking-[0.04em] text-creme transition-colors hover:bg-[#86411a] disabled:cursor-not-allowed disabled:bg-bordeaux/20"
            >
              <Send size={15} />
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-bordeaux text-creme shadow-[0_16px_40px_rgba(78,26,50,0.28)] transition-transform hover:-translate-y-0.5 md:bottom-8 md:right-8"
        aria-label="Ouvrir le formulaire de feedback"
      >
        <CircleHelp size={24} strokeWidth={1.8} />
      </button>
    </>
  )
}
