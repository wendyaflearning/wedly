'use client'
import { useState, useEffect } from 'react'
import type { OnboardingStep, ServiceOption } from '../../types'
import StepBreadcrumb from '../../StepBreadcrumb'

type ServiceNode = {
  id: string
  name: string
  children: ServiceNode[]
}

function LeafButton({ node, selected, onSelect }: {
  node: ServiceNode
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(node.id)}
      className={[
        'flex items-center gap-[10px] px-4 min-h-[44px] rounded-xl text-left transition-[background,border-color] duration-[180ms] w-full',
        selected
          ? 'bg-bordeaux border-[1.5px] border-bordeaux'
          : 'bg-creme border-[1.5px] border-bordeaux/20',
      ].join(' ')}
    >
      <div
        className={[
          'w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center transition-[background,border-color] duration-[180ms]',
          selected ? 'border-2 border-creme bg-creme' : 'border-2 border-bordeaux bg-transparent',
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
        {node.name}
      </span>
    </button>
  )
}

function PillButton({ node, selected, onSelect }: {
  node: ServiceNode
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(node.id)}
      className={[
        'px-[13px] py-[7px] rounded-full border-[1.5px] cursor-pointer font-cormorant font-light transition-[background,border-color,color] duration-150',
        selected
          ? 'bg-bordeaux border-bordeaux text-creme'
          : 'bg-transparent border-bordeaux/25 text-bordeaux',
      ].join(' ')}
      style={{ fontSize: 13 }}
    >
      {node.name}
    </button>
  )
}

function SubTypesPanel({ group, selectedId, onSelect }: {
  group: ServiceNode
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const isThreeLevel = (group.children[0]?.children.length ?? 0) > 0
  return (
    <div className="border-[1.5px] border-bordeaux/[0.19] rounded-xl overflow-hidden">
      <div className="px-[18px] pt-[18px] pb-[14px]">
        {isThreeLevel ? (
          group.children.map(sub => (
            <div key={sub.id} className="mb-4">
              <p className="font-josefin uppercase text-bordeaux/50 mb-2" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
                {sub.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {sub.children.map(leaf => (
                  <PillButton key={leaf.id} node={leaf} selected={selectedId === leaf.id} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-wrap gap-2">
            {group.children.map(child => (
              <PillButton key={child.id} node={child} selected={selectedId === child.id} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function findSelectedLeafName(group: ServiceNode, selectedId: string | null): string | null {
  if (!selectedId) return null
  for (const child of group.children) {
    if (child.children.length === 0) {
      if (child.id === selectedId) return child.name
    } else {
      for (const leaf of child.children) {
        if (leaf.id === selectedId) return leaf.name
      }
    }
  }
  return null
}

function Accordion({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

export default function ProfessionsStep({
  token,
  initialServices,
  steps,
  currentStepKey,
  onBack,
  onNext,
  onNavigate,
}: {
  token: string
  initialServices: ServiceOption[]
  steps: OnboardingStep[]
  currentStepKey: string
  onBack: () => void
  onNext: (nextStep: string) => void
  onNavigate: (stepKey: string) => void
}) {
  const [services,   setServices]   = useState<ServiceNode[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(initialServices[0]?.id ?? null)
  const [error,      setError]      = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)

  const isDirty = !success && selectedId !== (initialServices[0]?.id ?? null)

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then((data: ServiceNode[]) => setServices(data))
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
      setSuccess(true)
      setTimeout(() => onNext(json.current_step), 1000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const flatItems  = services.filter(s => s.children.length === 0)
  const groupItems = services.filter(s => s.children.length > 0)

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

        <div className="px-8">

          <h2
            className="font-cormorant text-bordeaux font-light leading-tight mb-5"
            style={{ fontSize: 'clamp(20px, 2.8vw, 30px)' }}
          >
            Qu&apos;est-ce que vous proposez&nbsp;?
          </h2>

          <div className="bg-bordeaux/[0.03] border border-bordeaux/10 rounded-xl px-[18px] py-[14px] mb-8">
            <p className="font-cormorant text-texte text-sm font-light leading-[1.7]">
              Sélectionnez votre spécialité principale. Elle détermine dans quelle catégorie votre profil apparaît aux couples.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-[10px] mb-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="mb-7 flex flex-col gap-[10px]">

              {/* Grille 2 colonnes : items plats + tous les groupes */}
              {(flatItems.length > 0 || groupItems.length > 0) && (
                <div className="grid grid-cols-2 gap-[10px]">
                  {flatItems.map(node => (
                    <LeafButton
                      key={node.id}
                      node={node}
                      selected={selectedId === node.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                  {groupItems.map(group => {
                    const isSelected = selectedId === group.id || findSelectedLeafName(group, selectedId) !== null
                    return (
                      <LeafButton
                        key={group.id}
                        node={group}
                        selected={isSelected}
                        onSelect={setSelectedId}
                      />
                    )
                  })}
                </div>
              )}

              {/* SubTypesPanel pleine largeur — s'ouvre au clic, un seul à la fois */}
              {groupItems.map(group => {
                const isSelected = selectedId === group.id || findSelectedLeafName(group, selectedId) !== null
                return (
                  <Accordion key={group.id} open={isSelected}>
                    <div className="pt-1">
                      <SubTypesPanel
                        group={group}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                      />
                    </div>
                  </Accordion>
                )
              })}
            </div>
          )}

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mb-4">{error}</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedId || submitting || success}
            className="relative overflow-hidden w-full bg-accent text-creme font-josefin uppercase tracking-[0.1em] text-[13px] rounded-xl py-[17px] px-7 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-8"
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
