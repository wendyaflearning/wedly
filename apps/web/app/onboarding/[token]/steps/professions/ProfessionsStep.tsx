'use client'
import { useState, useEffect } from 'react'
import type { ServiceOption } from '../../types'

export default function ProfessionsStep({
  token,
  initialServices,
  onBack,
  onNext,
}: {
  token: string
  initialServices: ServiceOption[]
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(initialServices[0]?.id ?? null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  console.log(services, initialServices);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then((data: ServiceOption[]) => setServices(data))
      .catch(() => setError('Impossible de charger les services.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm() {
    if (!selectedId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'professions', data: { service_ids: [selectedId] } }),
      })
      if (!res.ok) {
        setError('Une erreur est survenue.')
        return
      }
      const json = await res.json()
      console.log(json)
      setSuccess(true)
      setTimeout(() => onNext(json.current_step), 1000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-creme px-6 py-10">
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
              Étape 1 / 6
            </span>
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        {/* Barre de progression segmentée */}
        <div className="flex gap-1.5 px-8 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={['flex-1 h-[3px] rounded-full', i === 0 ? 'bg-bordeaux' : 'bg-bordeaux/15'].join(' ')}
            />
          ))}
        </div>

        <div className="px-8">

          {/* Titre */}
          <h2
            className="font-cormorant text-bordeaux font-light leading-tight mb-5"
            style={{ fontSize: 'clamp(20px, 2.8vw, 30px)' }}
          >
            Qu&apos;est-ce que vous proposez&nbsp;?
          </h2>

          {/* Info box */}
          <div className="bg-bordeaux/[0.03] border border-bordeaux/10 rounded-xl px-[18px] py-[14px] mb-8">
            <p className="font-cormorant text-texte text-sm font-light leading-[1.7]">
              Sélectionnez votre spécialité principale. Elle détermine dans quelle catégorie votre profil apparaît aux couples.
            </p>
          </div>

          {/* Grille des services */}
          {loading ? (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {services.map(service => {
                const selected = selectedId === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedId(service.id)}
                    className={[
                      'flex items-center gap-[10px] px-4 py-[14px] rounded-xl text-left transition-[background,border-color] duration-[180ms]',
                      selected
                        ? 'bg-bordeaux border-[1.5px] border-bordeaux'
                        : 'bg-creme border-[1.5px] border-bordeaux/20',
                    ].join(' ')}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={[
                        'w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center transition-[background,border-color] duration-[180ms]',
                        selected
                          ? 'border-2 border-creme bg-creme'
                          : 'border-2 border-bordeaux bg-transparent',
                      ].join(' ')}
                    >
                      {selected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <span
                      className={[
                        'font-cormorant font-light tracking-[0.01em] transition-colors duration-[180ms]',
                        selected ? 'text-creme' : 'text-bordeaux',
                      ].join(' ')}
                      style={{ fontSize: 15 }}
                    >
                      {service.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Erreur inline */}
          {error && (
            <p className="font-josefin text-sm text-highlight text-center mb-4">{error}</p>
          )}

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={!selectedId || submitting || success}
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
            {submitting ? 'ENVOI…' : success ? '✓ Enregistré' : 'Confirmer →'}
          </button>

        </div>
      </div>
    </div>
  )
}
