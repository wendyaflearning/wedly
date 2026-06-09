'use client'
import { useState } from 'react'
import type { LegalInfoData, OnboardingStep } from '../../types'
import StepBreadcrumb from '../../StepBreadcrumb'
import { patchOnboardingStep } from '../../lib/patchOnboardingStep'

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
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
      </div>
      {hint && (
        <p className="font-cormorant italic" style={{ fontSize: 12, color: 'rgba(41,26,16,0.38)', marginTop: 6 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

export default function LegalInfoStep({
  token,
  initialData,
  steps,
  currentStepKey,
  onBack,
  onNext,
  onNavigate,
}: {
  token:          string
  initialData:    LegalInfoData | null
  steps:          OnboardingStep[]
  currentStepKey: string
  onBack:         () => void
  onNext:         (nextStep: string) => void
  onNavigate:     (stepKey: string) => void
}) {
  const [brandName, setBrandName] = useState(initialData?.brand_name ?? '')
  const [firstName, setFirstName] = useState(initialData?.first_name ?? '')
  const [lastName, setLastName]   = useState(initialData?.last_name  ?? '')
  const [phone, setPhone]         = useState(initialData?.phone      ?? '')
  const [address, setAddress]     = useState(initialData?.address   ?? '')
  const [zipcode, setZipcode]     = useState(initialData?.zipcode   ?? '')
  const [city, setCity]           = useState(initialData?.city      ?? '')
  const [siret, setSiret]         = useState(initialData?.siret     ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const isDirty = !success && (
    brandName !== (initialData?.brand_name ?? '') ||
    firstName !== (initialData?.first_name ?? '') ||
    lastName  !== (initialData?.last_name  ?? '') ||
    phone     !== (initialData?.phone      ?? '') ||
    address   !== (initialData?.address    ?? '') ||
    zipcode   !== (initialData?.zipcode    ?? '') ||
    city      !== (initialData?.city       ?? '') ||
    siret     !== (initialData?.siret      ?? '')
  )

  const siretClean = siret.replace(/\s/g, '')
  const isValid    = brandName.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && /^\d{14}$/.test(siretClean)

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)
    try {
      const json = await patchOnboardingStep(token, 'legal_info', {
        brand_name: brandName.trim(),
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        siret:      siretClean,
        phone:      phone     || null,
        address:    address   || null,
        zipcode:    zipcode   || null,
        city:       city      || null,
      })
      setSuccess(true)
      setTimeout(() => onNext(json.current_step), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel = submitting ? 'Envoi en cours…' : success ? '✓ Enregistré' : 'Confirmer →'

  return (
    <div className="min-h-screen bg-creme">
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
            style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', color: '#291A10', lineHeight: 1.3, marginBottom: 20 }}
          >
            Votre identité, <em>en toute confiance.</em>
          </h2>

          <div style={{
            background: 'rgba(78,26,50,0.03)', border: '1px solid rgba(78,26,50,0.125)',
            borderRadius: 10, padding: '13px 17px', marginBottom: 32,
          }}>
            <p className="font-cormorant font-light text-texte" style={{ fontSize: 14, lineHeight: 1.8 }}>
              Ces informations ne sont pas publiques.<br />
              Elles nous permettent de valider votre profil.{' '}
              <span style={{ color: 'rgba(41,26,16,0.5)' }}>La validation prend 48 à 72h.</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <Field
              label="Nom commercial"
              value={brandName}
              onChange={setBrandName}
              placeholder="Ex : Atelier Lumière, Studio Mariage…"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field
                label="Votre prénom"
                value={firstName}
                onChange={setFirstName}
                placeholder="Marie"
              />
              <Field
                label="Votre nom"
                value={lastName}
                onChange={setLastName}
                placeholder="Dupont"
              />
            </div>

            <Field
              label="Numéro de téléphone professionnel"
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="+33 6 00 00 00 00"
            />

            <Field
              label="Adresse professionnelle"
              value={address}
              onChange={setAddress}
              placeholder="12 rue de la Paix"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <Field
                label="Code postal"
                value={zipcode}
                onChange={setZipcode}
                placeholder="75001"
              />
              <Field
                label="Ville"
                value={city}
                onChange={setCity}
                placeholder="Paris"
              />
            </div>

            <Field
              label="SIRET"
              value={siret}
              onChange={setSiret}
              placeholder="000 000 000 00000"
              hint="14 chiffres — auto-entrepreneur, SASU, EURL…"
            />

          </div>

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          <div style={{ marginTop: 32, paddingBottom: 32 }}>
            <button
              onClick={handleConfirm}
              disabled={!isValid || submitting || success}
              className="w-full font-josefin uppercase text-creme flex items-center justify-center gap-2.5"
              style={{
                padding: '17px 28px', borderRadius: 12, border: 'none',
                fontSize: 13, letterSpacing: '0.1em',
                background: isValid ? 'var(--color-accent)' : 'rgba(78,26,50,0.145)',
                cursor: isValid && !submitting && !success ? 'pointer' : 'default',
                animation: isValid && !submitting && !success ? 'pulse-cta 2.8s ease-in-out 1s infinite' : 'none',
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
