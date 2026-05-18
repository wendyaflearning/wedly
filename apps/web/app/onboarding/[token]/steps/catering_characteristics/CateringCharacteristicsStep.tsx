'use client'
import { useState } from 'react'
import type { CateringDetails } from '../../types'

type InitialData = Pick<
  CateringDetails,
  'covers_min' | 'covers_max' |
  'is_kosher' | 'is_halal' | 'is_vegan' | 'is_gluten_free' |
  'is_offers_table_service' | 'is_offers_buffet' | 'is_offers_cocktail' |
  'is_provide_tableware' | 'is_provide_furniture'
>

type Formulas = {
  is_offers_table_service: boolean
  is_offers_buffet:        boolean
  is_offers_cocktail:      boolean
}

type Dietary = {
  is_kosher:      boolean
  is_halal:       boolean
  is_vegan:       boolean
  is_gluten_free: boolean
}

type Equipment = {
  is_provide_tableware: boolean | null
  is_provide_furniture: boolean | null
}

const FORMULAS: Array<{ field: keyof Formulas; label: string }> = [
  { field: 'is_offers_table_service', label: 'Service à table' },
  { field: 'is_offers_buffet',        label: 'Buffet' },
  { field: 'is_offers_cocktail',      label: 'Cocktail' },
]

const DIETARY_OPTIONS: Array<{ field: keyof Dietary; label: string }> = [
  { field: 'is_kosher',      label: 'Casher' },
  { field: 'is_halal',       label: 'Halal' },
  { field: 'is_vegan',       label: 'Vegan' },
  { field: 'is_gluten_free', label: 'Sans gluten' },
]

const EQUIPMENT_OPTIONS: Array<{ field: keyof Equipment; label: string }> = [
  { field: 'is_provide_tableware', label: 'Vaisselle fournie' },
  { field: 'is_provide_furniture', label: 'Mobilier fourni' },
]

export default function CateringCharacteristicsStep({
  token,
  initialData,
  onBack,
  onNext,
}: {
  token: string
  initialData: InitialData | null
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const [coversMin, setCoversMin] = useState<string>(initialData?.covers_min?.toString() ?? '')
  const [coversMax, setCoversMax] = useState<string>(initialData?.covers_max?.toString() ?? '')

  const [formulas, setFormulas] = useState<Formulas>({
    is_offers_table_service: initialData?.is_offers_table_service ?? false,
    is_offers_buffet:        initialData?.is_offers_buffet ?? false,
    is_offers_cocktail:      initialData?.is_offers_cocktail ?? false,
  })

  const [dietary, setDietary] = useState<Dietary>({
    is_kosher:      initialData?.is_kosher ?? false,
    is_halal:       initialData?.is_halal ?? false,
    is_vegan:       initialData?.is_vegan ?? false,
    is_gluten_free: initialData?.is_gluten_free ?? false,
  })

  const [equipment, setEquipment] = useState<Equipment>({
    is_provide_tableware: initialData?.is_provide_tableware ?? null,
    is_provide_furniture: initialData?.is_provide_furniture ?? null,
  })

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const isValid =
    coversMin !== '' &&
    coversMax !== '' &&
    equipment.is_provide_tableware !== null &&
    equipment.is_provide_furniture !== null

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'catering_characteristics',
          data: {
            covers_min: Number(coversMin),
            covers_max: Number(coversMax),
            ...formulas,
            ...dietary,
            ...equipment,
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
              Étape 3 / 7
            </span>
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        {/* Barre de progression */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`w-8 h-[3px] rounded-full ${i < 3 ? 'bg-bordeaux' : 'bg-bordeaux/15'}`} />
          ))}
        </div>

        {/* Contenu */}
        <div style={{ padding: '32px 32px 0' }}>

          {/* Titre */}
          <h2
            className="font-cormorant font-light text-bordeaux"
            style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', lineHeight: 1.3, marginBottom: 28 }}
          >
            Parlez-nous de<br />
            <em>votre offre.</em>
          </h2>

          {/* ── Couverts ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>
            Couverts
          </span>
          <p className="font-manrope" style={{ fontSize: 12, color: 'rgba(41,26,16,0.52)', marginBottom: 14, lineHeight: 1.5 }}>
            Combien de personnes pouvez-vous servir ?
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
                  placeholder="20"
                  value={coversMin}
                  onChange={e => setCoversMin(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 56px 13px 16px',
                    border: `1.5px solid ${coversMin !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.208)'}`,
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
                  placeholder="200"
                  value={coversMax}
                  onChange={e => setCoversMax(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 56px 13px 16px',
                    border: `1.5px solid ${coversMax !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.208)'}`,
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

          {/* ── Formules proposées ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10, marginTop: 28 }}>
            Formules proposées
          </span>
          <p className="font-manrope" style={{ fontSize: 12, color: 'rgba(41,26,16,0.52)', marginBottom: 14, lineHeight: 1.5 }}>
            Quels types de service proposez-vous ?
          </p>
          <div className="flex flex-col gap-2 mb-7">
            {FORMULAS.map(({ field, label }) => {
              const checked = formulas[field]
              return (
                <button
                  key={field}
                  onClick={() => setFormulas(prev => ({ ...prev, [field]: !prev[field] }))}
                  className="flex items-center font-manrope"
                  style={{
                    gap: 14, width: '100%', padding: '14px 18px',
                    background: checked ? 'var(--color-bordeaux)' : 'var(--color-creme)',
                    border: `1.5px solid ${checked ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.133)'}`,
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: checked ? '2px solid var(--color-creme)' : '2px solid rgba(78,26,50,0.25)',
                    background: checked ? 'var(--color-creme)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: '0.18s',
                  }}>
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: checked ? 'var(--color-creme)' : 'rgba(41,26,16,0.75)',
                    transition: 'color 0.18s',
                  }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Restrictions alimentaires ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 10, marginTop: 28 }}>
            Restrictions alimentaires gérées
          </span>
          <p className="font-manrope" style={{ fontSize: 12, color: 'rgba(41,26,16,0.52)', marginBottom: 14, lineHeight: 1.5 }}>
            Quels régimes alimentaires maîtrisez-vous ?
          </p>
          <div className="flex flex-col gap-2 mb-7">
            {DIETARY_OPTIONS.map(({ field, label }) => {
              const checked = dietary[field]
              return (
                <button
                  key={field}
                  onClick={() => setDietary(prev => ({ ...prev, [field]: !prev[field] }))}
                  className="flex items-center font-manrope"
                  style={{
                    gap: 14, width: '100%', padding: '14px 18px',
                    background: checked ? 'var(--color-bordeaux)' : 'var(--color-creme)',
                    border: `1.5px solid ${checked ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.133)'}`,
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: checked ? '2px solid var(--color-creme)' : '2px solid rgba(78,26,50,0.25)',
                    background: checked ? 'var(--color-creme)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: '0.18s',
                  }}>
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: checked ? 'var(--color-creme)' : 'rgba(41,26,16,0.75)',
                    transition: 'color 0.18s',
                  }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Fourniture du matériel ── */}
          <span className="font-josefin uppercase text-gris block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 14, marginTop: 28 }}>
            Fourniture du matériel
          </span>
          <div className="flex flex-col gap-[14px] mb-7">
            {EQUIPMENT_OPTIONS.map(({ field, label }, index) => {
              const value = equipment[field]
              return (
                <div key={field}>
                  <p className="font-manrope" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(41,26,16,0.55)', marginBottom: 8, lineHeight: 1.4 }}>
                    {label}
                  </p>
                  <div className="grid grid-cols-2 gap-[10px]">
                    {([true, false] as const).map(opt => (
                      <button
                        key={String(opt)}
                        onClick={() => setEquipment(prev => ({ ...prev, [field]: opt }))}
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
                  {index < EQUIPMENT_OPTIONS.length - 1 && (
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
