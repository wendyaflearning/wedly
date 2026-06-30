'use client'
import { useState } from 'react'
import type { OnboardingStep } from '../../types'
import StepBreadcrumb from '../../StepBreadcrumb'
import { patchOnboardingStep } from '../../lib/patchOnboardingStep'

export default function ConsentStep({
  token,
  steps,
  currentStepKey,
  onBack,
  onNext,
  onNavigate,
}: {
  token: string
  steps: OnboardingStep[]
  currentStepKey: string
  onBack: () => void
  onNext: (nextStep: string) => void
  onNavigate: (stepKey: string) => void
}) {
  const [submitting, setSubmitting] = useState<'accept' | 'skip' | null>(null)
  const [error, setError]           = useState<string | null>(null)

  async function handleConsent(granted: boolean) {
    setSubmitting(granted ? 'accept' : 'skip')
    setError(null)
    try {
      const json = await patchOnboardingStep(token, 'consent', { granted })
      onNext(json.current_step)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-creme)',
          borderBottom: '1px solid rgba(78, 26, 50, 0.094)',
          padding: '18px 24px 14px',
        }}>
          <div style={{ minHeight: 18, marginBottom: 14 }}>
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
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        <StepBreadcrumb steps={steps} currentStepKey={currentStepKey} onNavigate={onNavigate} />

        {/* Content + CTA */}
        <div className="px-8 flex flex-col flex-1">

          {/* Shield icon */}
          <div className="mb-8 mt-2">
            <div
              className="flex items-center justify-center rounded-2xl border-2 border-bordeaux/25"
              style={{ width: 56, height: 56 }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 5.5V11c0 4.42 3.39 8.56 8 9.93 4.61-1.37 8-5.51 8-9.93V5.5L12 2Z"
                  stroke="var(--color-bordeaux)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="var(--color-bordeaux)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2
            className="font-cormorant text-bordeaux font-light leading-[1.18] mb-6"
            style={{ fontSize: 'clamp(28px, 6vw, 38px)' }}
          >
            Pour vous connecter aux bons couples, on a besoin de mieux vous{' '}
            <em>connaître</em>.
          </h2>

          {/* Body */}
          <p
            className="text-texte leading-[1.75]"
            style={{ fontFamily: 'var(--font-manrope-var)', fontSize: 14 }}
          >
            Nous allons vous poser des questions sur vos expériences de cérémonies et les univers culturels que vous maîtrisez. Ces informations sont utilisées uniquement pour affiner votre matching avec les couples — elles restent privées, ne sont jamais affichées sur votre profil public, et vous pouvez les modifier à tout moment.
          </p>

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-6">{error}</p>
          )}

          {/* Push CTAs to bottom */}
          <div className="flex-1" />

          {/* CTA footer */}
          <div className="pb-10 pt-8 flex flex-col items-center gap-5">
            <button
              onClick={() => handleConsent(true)}
              disabled={submitting !== null}
              className="relative overflow-hidden w-full bg-accent text-creme font-josefin uppercase tracking-[0.1em] text-[13px] rounded-xl py-[17px] px-7 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                  animation: 'shimmer-sweep 2.2s ease-in-out infinite',
                }}
              />
              {submitting === 'accept' ? 'ENVOI…' : "J'ACCEPTE ET JE CONTINUE →"}
            </button>

            <button
              onClick={() => handleConsent(false)}
              disabled={submitting !== null}
              className="font-cormorant text-texte/55 underline underline-offset-4 cursor-pointer disabled:opacity-40 bg-transparent border-none"
              style={{ fontSize: 15 }}
            >
              {submitting === 'skip' ? 'En cours…' : 'Je préfère passer'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
