'use client'
import { useState, useEffect } from 'react'
import type { ExperienceOption, OnboardingStep, VendorType } from '../../types'
import StepBreadcrumb from '../../StepBreadcrumb'
import { patchOnboardingStep } from '../../lib/patchOnboardingStep'

export default function ExperiencesStep({
  token,
  vendorType,
  initialExperiences,
  steps,
  currentStepKey,
  onBack,
  onNext,
  onNavigate,
}: {
  token: string
  vendorType: VendorType
  initialExperiences: { confession_ids: ExperienceOption[]; culture_ids: ExperienceOption[] }
  steps: OnboardingStep[]
  currentStepKey: string
  onBack: () => void
  onNext: (nextStep: string) => void
  onNavigate: (stepKey: string) => void
}) {
  const [confessions, setConfessions] = useState<ExperienceOption[]>([])
  const [cultures, setCultures] = useState<ExperienceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [formStep, setFormStep] = useState<'cultures' | 'confessions'>('cultures')
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>(
    initialExperiences.culture_ids.map(c => c.id)
  )
  const [selectedConfessionIds, setSelectedConfessionIds] = useState<string[]>(
    initialExperiences.confession_ids.map(c => c.id)
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initCultureIds = initialExperiences.culture_ids.map(c => c.id).sort().join(',')
  const initConfessionIds = initialExperiences.confession_ids.map(c => c.id).sort().join(',')
  const isDirty = !success && (
    [...selectedCultureIds].sort().join(',') !== initCultureIds ||
    [...selectedConfessionIds].sort().join(',') !== initConfessionIds
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/confessions').then(r => r.json()),
      fetch('/api/cultures').then(r => r.json()),
    ])
      .then(([confessionsData, culturesData]) => {
        setConfessions(confessionsData)
        setCultures(culturesData)
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [])

  function toggleId(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  async function handleConfirm() {
    if (selectedConfessionIds.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const json = await patchOnboardingStep(token, 'experiences', {
        confession_ids: selectedConfessionIds,
        culture_ids:    selectedCultureIds,
      })
      setSuccess(true)
      setTimeout(() => onNext(json.current_step), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const isCulturesForm = formStep === 'cultures'
  const items = isCulturesForm ? cultures : confessions
  const selectedIds = isCulturesForm ? selectedCultureIds : selectedConfessionIds
  const setSelectedIds = isCulturesForm
    ? (v: string[]) => setSelectedCultureIds(v)
    : (v: string[]) => setSelectedConfessionIds(v)
  const hasSelection = selectedIds.length > 0
  const title = isCulturesForm
    ? 'Quels univers de mariage connaissez-vous bien ?'
    : vendorType === 'createurs'
      ? 'Quels types de mariages avez-vous déjà habillés ?'
      : 'Quels types de cérémonies religieuses avez-vous déjà accompagnées ?'
  const ctaLabel = isCulturesForm
    ? 'Continuer →'
    : (submitting ? 'ENVOI…' : success ? '✓ Enregistré' : 'Confirmer →')

  function handleBack() {
    if (isCulturesForm) onBack()
    else setFormStep('cultures')
  }

  function handleCta() {
    if (isCulturesForm) setFormStep('confessions')
    else handleConfirm()
  }

  return (
    <div className="min-h-screen bg-creme">
      <div className="max-w-lg mx-auto">

        {/* Header sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-creme)',
          borderBottom: '1px solid rgba(78, 26, 50, 0.094)',
          padding: '18px 24px 14px',
        }}>
          <div className="flex items-center justify-between" style={{ minHeight: 18, marginBottom: 14 }}>
            <button
              onClick={handleBack}
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

        {/* Contenu */}
        <div style={{ padding: '0 32px 32px' }}>
          <h2
            className="font-cormorant font-light text-bordeaux"
            style={{ fontSize: 'clamp(18px, 2.6vw, 28px)', lineHeight: 1.35, marginBottom: 24 }}
          >
            {title}
          </h2>

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/10 animate-pulse" />
              ))}
            </div>
          )}

          {/* Cultures — grille 2 colonnes, checkboxes carrées */}
          {!loading && isCulturesForm && (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {cultures.map(culture => {
                const selected = selectedCultureIds.includes(culture.id)
                return (
                  <button
                    key={culture.id}
                    onClick={() => toggleId(selectedCultureIds, setSelectedCultureIds, culture.id)}
                    className={[
                      'flex items-center gap-[10px] px-4 py-[14px] rounded-xl text-left transition-[background,border-color] duration-[180ms]',
                      selected
                        ? 'bg-bordeaux border-[1.5px] border-bordeaux'
                        : 'bg-creme border-[1.5px] border-bordeaux/20',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center transition-[background,border-color] duration-[180ms]',
                      selected ? 'border-2 border-creme bg-creme' : 'border-2 border-bordeaux bg-transparent',
                    ].join(' ')}>
                      {selected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={['font-cormorant font-light tracking-[0.01em] transition-colors duration-[180ms]',
                        selected ? 'text-creme' : 'text-bordeaux'].join(' ')}
                      style={{ fontSize: 15 }}
                    >
                      {culture.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Confessions — grille 2 colonnes, checkboxes carrées */}
          {!loading && !isCulturesForm && (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {confessions.map(confession => {
                const selected = selectedConfessionIds.includes(confession.id)
                return (
                  <button
                    key={confession.id}
                    onClick={() => toggleId(selectedConfessionIds, setSelectedConfessionIds, confession.id)}
                    className={[
                      'flex items-center gap-[10px] px-4 py-[14px] rounded-xl text-left transition-[background,border-color] duration-[180ms]',
                      selected
                        ? 'bg-bordeaux border-[1.5px] border-bordeaux'
                        : 'bg-creme border-[1.5px] border-bordeaux/20',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center transition-[background,border-color] duration-[180ms]',
                      selected ? 'border-2 border-creme bg-creme' : 'border-2 border-bordeaux bg-transparent',
                    ].join(' ')}>
                      {selected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={['font-cormorant font-light tracking-[0.01em] transition-colors duration-[180ms]',
                        selected ? 'text-creme' : 'text-bordeaux'].join(' ')}
                      style={{ fontSize: 15 }}
                    >
                      {confession.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          {/* CTA */}
          <div style={{ marginTop: 28 }}>
            <button
              onClick={handleCta}
              disabled={loading || !hasSelection || submitting || success}
              style={{
                width: '100%', padding: '17px 28px', borderRadius: 12,
                border: 'none', color: 'var(--color-creme)',
                fontFamily: '"Josefin Sans", "Gill Sans", sans-serif',
                fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: !loading && hasSelection ? 'var(--color-accent)' : 'rgba(78,26,50,0.145)',
                cursor: !loading && hasSelection && !submitting && !success ? 'pointer' : 'default',
                animation: !loading && hasSelection && !submitting && !success ? 'pulse-cta 2.8s ease-in-out 1s infinite' : 'none',
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
