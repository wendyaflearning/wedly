'use client'
import { useState } from 'react'
import type { VenueDetails } from '../../types'

const VENUE_TYPES = [
  { value: 'chateau',      label: 'Château' },
  { value: 'domaine',      label: 'Domaine' },
  { value: 'loft',         label: 'Loft' },
  { value: 'mas',          label: 'Mas' },
  { value: 'manoir',       label: 'Manoir' },
  { value: 'industriel',   label: 'Industriel' },
  { value: 'contemporain', label: 'Contemporain' },
  { value: 'autre',        label: 'Autre' },
]

const BOOLEAN_OPTIONS: Array<{
  field: 'has_catering' | 'has_accommodation' | 'has_outdoor_space' | 'is_pmr_accessible'
  label: string
}> = [
  { field: 'has_catering',      label: 'Traiteur inclus' },
  { field: 'has_accommodation', label: 'Couchages sur place' },
  { field: 'has_outdoor_space', label: 'Espace extérieur disponible' },
  { field: 'is_pmr_accessible', label: 'Accessible PMR' },
]

type BoolValues = {
  has_catering:      boolean | null
  has_accommodation: boolean | null
  has_outdoor_space: boolean | null
  is_pmr_accessible: boolean | null
}

type InitialData = Pick<
  VenueDetails,
  'venue_type' | 'capacity_min' | 'capacity_max' | 'has_catering' | 'has_accommodation' | 'has_outdoor_space' | 'is_pmr_accessible'
>

export default function VenueCharacteristicsStep({
  token,
  initialVenueDetails,
  onBack,
  onNext,
}: {
  token: string
  initialVenueDetails: InitialData | null
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const [venueType, setVenueType]     = useState<string | null>(initialVenueDetails?.venue_type ?? null)
  const [capacityMin, setCapacityMin] = useState<string>(initialVenueDetails?.capacity_min?.toString() ?? '')
  const [capacityMax, setCapacityMax] = useState<string>(initialVenueDetails?.capacity_max?.toString() ?? '')
  const [bools, setBools]             = useState<BoolValues>({
    has_catering:      initialVenueDetails?.has_catering ?? null,
    has_accommodation: initialVenueDetails?.has_accommodation ?? null,
    has_outdoor_space: initialVenueDetails?.has_outdoor_space ?? null,
    is_pmr_accessible: initialVenueDetails?.is_pmr_accessible ?? null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const isValid =
    venueType !== null &&
    capacityMin !== '' &&
    capacityMax !== '' &&
    bools.has_catering !== null &&
    bools.has_accommodation !== null &&
    bools.has_outdoor_space !== null &&
    bools.is_pmr_accessible !== null

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'venue_characteristics',
          data: {
            venue_type:        venueType,
            capacity_min:      Number(capacityMin),
            capacity_max:      Number(capacityMax),
            has_catering:      bools.has_catering,
            has_accommodation: bools.has_accommodation,
            has_outdoor_space: bools.has_outdoor_space,
            is_pmr_accessible: bools.is_pmr_accessible,
          },
        }),
      })
      if (!res.ok) { setError('Une erreur est survenue.'); return }
      const json = await res.json()
      setSuccess(true)
      setTimeout(() => onNext(json.current_step), 1000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel = submitting ? 'ENVOI…' : success ? '✓ Enregistré' : 'CONFIRMER →'

  return (
    <div className="min-h-screen bg-creme">
      <div className="max-w-lg mx-auto">

        {/* Header sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-creme)',
          borderBottom: '1px solid rgba(78, 26, 50, 0.094)',
          padding: '20px 32px 16px',
        }}>
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-josefin uppercase"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(41,26,16,0.42)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="rgba(41,26,16,0.42)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour
            </button>
            <span className="font-josefin uppercase" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--color-bordeaux)' }}>
              Étape 2 / 6
            </span>
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        {/* Barre de progression */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-8 h-[3px] rounded-full ${i < 2 ? 'bg-bordeaux' : 'bg-bordeaux/15'}`} />
          ))}
        </div>

        {/* Contenu */}
        <div style={{ padding: '32px 32px 0' }}>

          {/* Titre */}
          <h2
            className="font-cormorant font-light text-bordeaux"
            style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', lineHeight: 1.3, marginBottom: 20 }}
          >
            Parlez-nous de<br />
            <em>votre lieu.</em>
          </h2>

          {/* ── Capacité d'accueil ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>
            Capacité d&apos;accueil
          </span>
          <p className="font-manrope" style={{ fontSize: 12, color: 'rgba(41,26,16,0.52)', marginBottom: 14, lineHeight: 1.5 }}>
            Combien de personnes pouvez-vous accueillir ?
          </p>
          <div className="grid grid-cols-2 gap-3 mb-7">
            <div>
              <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.07em', color: 'rgba(41,26,16,0.42)', marginBottom: 6 }}>
                De
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  placeholder="50"
                  value={capacityMin}
                  onChange={e => setCapacityMin(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 56px 13px 16px',
                    border: `1.5px solid ${capacityMin !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.208)'}`,
                    borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                    fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                    color: 'var(--color-bordeaux)', transition: 'border-color 0.18s',
                  }}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-manrope-var, sans-serif)', fontSize: 11, fontWeight: 500, color: 'rgba(41,26,16,0.38)', pointerEvents: 'none' }}>
                  pers.
                </span>
              </div>
            </div>
            <div>
              <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.07em', color: 'rgba(41,26,16,0.42)', marginBottom: 6 }}>
                À
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  placeholder="300"
                  value={capacityMax}
                  onChange={e => setCapacityMax(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 56px 13px 16px',
                    border: `1.5px solid ${capacityMax !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.208)'}`,
                    borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                    fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                    color: 'var(--color-bordeaux)', transition: 'border-color 0.18s',
                  }}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-manrope-var, sans-serif)', fontSize: 11, fontWeight: 500, color: 'rgba(41,26,16,0.38)', pointerEvents: 'none' }}>
                  pers.
                </span>
              </div>
            </div>
          </div>

          {/* ── Cachet particulier ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10, marginTop: 20 }}>
            Cachet particulier
          </span>
          <div className="grid grid-cols-2 gap-2 mb-7">
            {VENUE_TYPES.map(({ value, label }) => {
              const selected = venueType === value
              return (
                <button
                  key={value}
                  onClick={() => setVenueType(value)}
                  className="font-manrope"
                  style={{
                    padding: '11px 0',
                    background: selected ? 'var(--color-bordeaux)' : 'var(--color-creme)',
                    border: `1.5px solid ${selected ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.133)'}`,
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, textAlign: 'center',
                    color: selected ? 'var(--color-creme)' : 'rgba(41,26,16,0.75)',
                    transition: 'background 0.18s, border-color 0.18s, color 0.18s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Options ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10, marginTop: 20 }}>
            Options
          </span>
          <div className="flex flex-col gap-[14px] mb-7">
            {BOOLEAN_OPTIONS.map(({ field, label }, index) => {
              const value = bools[field]
              return (
                <div key={field}>
                  <p className="font-manrope" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(41,26,16,0.55)', marginBottom: 8, lineHeight: 1.4 }}>
                    {label}
                  </p>
                  <div className="grid grid-cols-2 gap-[10px]">
                    {([true, false] as const).map(opt => (
                      <button
                        key={String(opt)}
                        onClick={() => setBools(prev => ({ ...prev, [field]: opt }))}
                        className="font-manrope"
                        style={{
                          padding: '13px 0', borderRadius: 12, cursor: 'pointer',
                          fontSize: 14, fontWeight: 600, textAlign: 'center',
                          background: value === opt ? 'var(--color-bordeaux)' : 'var(--color-creme)',
                          border: `1.5px solid ${value === opt ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.133)'}`,
                          color: value === opt ? 'var(--color-creme)' : 'rgba(41,26,16,0.55)',
                          transition: 'background 0.18s, border-color 0.18s, color 0.18s',
                        }}
                      >
                        {opt ? 'Oui' : 'Non'}
                      </button>
                    ))}
                  </div>
                  {index < BOOLEAN_OPTIONS.length - 1 && (
                    <div style={{ height: 1, background: 'rgba(78,26,50,0.07)', marginTop: 14 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Erreur */}
          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          {/* CTA */}
          <div style={{ marginTop: 32, marginBottom: 20 }}>
            <button
              onClick={handleConfirm}
              disabled={!isValid || submitting || success}
              style={{
                width: '100%', padding: '17px 28px', borderRadius: 12,
                border: 'none', color: 'var(--color-creme)',
                fontFamily: '"Josefin Sans", "Gill Sans", sans-serif',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
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
