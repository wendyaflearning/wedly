'use client'
import { useState } from 'react'
import type { OnboardingStep } from '../../types'
import StepBreadcrumb from '../../StepBreadcrumb'
import IncompleteStepsModal from './IncompleteStepsModal'

function Field({
  label, value, onChange, type = 'text', placeholder, hint,
}: {
  label:       string
  value:       string
  onChange:    (v: string) => void
  type?:       string
  placeholder: string
  hint?:       string
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value !== ''

  return (
    <div>
      <label className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.5)', marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        suppressHydrationWarning
        style={{
          width: '100%', padding: '15px 18px',
          border: `1.5px solid ${active ? 'rgba(78,26,50,0.55)' : 'rgba(78,26,50,0.22)'}`,
          borderRadius: 10, background: 'transparent', outline: 'none',
          fontFamily: 'var(--font-cormorant-var), Georgia, serif',
          fontSize: 16, color: '#291A10',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
      />
      {hint && (
        <p className="font-cormorant italic" style={{ fontSize: 12, color: 'rgba(41,26,16,0.38)', marginTop: 6 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function PasswordField({
  label, value, onChange, placeholder, show, onToggleShow,
}: {
  label:          string
  value:          string
  onChange:       (v: string) => void
  placeholder:    string
  show:           boolean
  onToggleShow:   () => void
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || value !== ''

  return (
    <div>
      <label className="font-josefin uppercase" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.5)', marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          suppressHydrationWarning
          style={{
            width: '100%', padding: '15px 48px 15px 18px',
            border: `1.5px solid ${active ? 'rgba(78,26,50,0.55)' : 'rgba(78,26,50,0.22)'}`,
            borderRadius: 10, background: 'transparent', outline: 'none',
            fontFamily: 'var(--font-cormorant-var), Georgia, serif',
            fontSize: 16, color: '#291A10',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(78,26,50,0.314)', transition: 'color 0.2s',
          }}
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

export default function CredentialsStep({
  token,
  initialEmail,
  steps,
  currentStepKey,
  onBack,
  onComplete,
  onNavigate,
}: {
  token:          string
  initialEmail:   string | null
  steps:          OnboardingStep[]
  currentStepKey: string
  onBack:         () => void
  onComplete:     () => void
  onNavigate:     (stepKey: string) => void
}) {
  const [email,           setEmail]           = useState(initialEmail ?? '')
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const isDirty = !success && (email !== (initialEmail ?? '') || password !== '' || passwordConfirm !== '')

  const emailValid     = /^[^@]+@[^@]+\.[^@]+$/.test(email.trim())
  const pwLengthOk     = password.length >= 8
  const pwSpecialOk    = /[\W_]/.test(password)
  const pwValid        = pwLengthOk && pwSpecialOk
  const confirmValid   = passwordConfirm !== '' && password === passwordConfirm
  const isValid        = emailValid && pwValid && confirmValid

  const incompleteSteps = steps.filter(s => s.stepKey !== 'credentials' && !s.isFilled)
  const [showModal, setShowModal] = useState(incompleteSteps.length > 0)

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'credentials',
          data: {
            email:                 email.trim(),
            password,
            password_confirmation: passwordConfirm,
          },
        }),
      })
      if (res.status === 409) {
        setError('Cet email est déjà utilisé.')
        return
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Une erreur est survenue.')
        return
      }
      setSuccess(true)
      setTimeout(() => onComplete(), 1000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel = submitting ? 'Envoi en cours…' : success ? '✓ Compte créé' : 'Créer mon profil →'

  return (
    <div className="min-h-screen bg-creme">
      {showModal && incompleteSteps.length > 0 && (
        <IncompleteStepsModal
          steps={incompleteSteps}
          onNavigate={onNavigate}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="max-w-lg mx-auto">

        {/* Header sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-creme)',
          borderBottom: '1px solid rgba(78,26,50,0.094)',
          padding: '18px 24px 14px',
        }}>
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

          <h2
            className="font-cormorant font-light"
            style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', color: '#291A10', lineHeight: 1.3, marginBottom: 32 }}
          >
            Votre espace <em>vous attend.</em>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="votre@email.com"
            />

            <div>
              <PasswordField
                label="Mot de passe"
                value={password}
                onChange={setPassword}
                placeholder="8 caractères minimum"
                show={showPassword}
                onToggleShow={() => setShowPassword(v => !v)}
              />
              {password !== '' && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="font-josefin" style={{ fontSize: 11, letterSpacing: '0.06em', color: pwLengthOk ? '#4E7A3A' : 'rgba(41,26,16,0.38)' }}>
                    {pwLengthOk ? '✓' : '○'} 8 caractères minimum
                  </span>
                  <span className="font-josefin" style={{ fontSize: 11, letterSpacing: '0.06em', color: pwSpecialOk ? '#4E7A3A' : 'rgba(41,26,16,0.38)' }}>
                    {pwSpecialOk ? '✓' : '○'} 1 caractère spécial (!@#…)
                  </span>
                </div>
              )}
            </div>

            <div>
              <PasswordField
                label="Confirmation du mot de passe"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="Répétez votre mot de passe"
                show={showConfirm}
                onToggleShow={() => setShowConfirm(v => !v)}
              />
              {passwordConfirm !== '' && password !== passwordConfirm && (
                <p className="font-josefin" style={{ fontSize: 11, letterSpacing: '0.06em', color: '#E35704', marginTop: 8 }}>
                  Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>

          </div>

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          <div style={{ marginTop: 32, paddingBottom: 32 }}>
            <button
              onClick={handleConfirm}
              disabled={!isValid || incompleteSteps.length > 0 || submitting || success}
              className="w-full font-josefin uppercase text-creme flex items-center justify-center gap-2.5"
              style={{
                padding: '17px 28px', borderRadius: 12, border: 'none',
                fontSize: 13, letterSpacing: '0.1em',
                background: isValid && incompleteSteps.length === 0 ? 'var(--color-accent)' : 'rgba(78,26,50,0.145)',
                cursor: isValid && incompleteSteps.length === 0 && !submitting && !success ? 'pointer' : 'default',
                animation: isValid && incompleteSteps.length === 0 && !submitting && !success ? 'pulse-cta 2.8s ease-in-out 1s infinite' : 'none',
                transition: 'background 0.3s, opacity 0.2s',
              }}
            >
              {ctaLabel}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
