'use client'
import { useState, useEffect } from 'react'
import type { ServiceOption } from '../../types'

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

function GroupCard({ group, open, selectedLeafName, onToggle }: {
  group: ServiceNode
  open: boolean
  selectedLeafName: string | null
  onToggle: () => void
}) {
  const hasSelection = selectedLeafName !== null
  return (
    <button
      onClick={onToggle}
      className={[
        'flex items-center gap-[10px] px-4 min-h-[44px] rounded-xl text-left w-full transition-[border-color] duration-[180ms] bg-creme',
        hasSelection ? 'border-[1.5px] border-bordeaux' : 'border-[1.5px] border-bordeaux/20',
      ].join(' ')}
    >
      <div className="w-4 h-4 rounded-[4px] shrink-0 border-2 border-bordeaux bg-transparent" />
      <div className="flex flex-col flex-1 py-[2px]">
        <span className="font-cormorant font-light text-bordeaux tracking-[0.01em]" style={{ fontSize: 15 }}>
          {group.name}
        </span>
        {selectedLeafName && (
          <span className="font-josefin" style={{ fontSize: 10, color: '#4E1A32', letterSpacing: '0.06em' }}>
            {selectedLeafName}
          </span>
        )}
      </div>
      <Chevron open={open} />
    </button>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  onBack,
  onNext,
}: {
  token: string
  initialServices: ServiceOption[]
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const [services,       setServices]       = useState<ServiceNode[]>([])
  const [loading,        setLoading]        = useState(true)
  const [selectedId,     setSelectedId]     = useState<string | null>(initialServices[0]?.id ?? null)
  const [openGroupId,    setOpenGroupId]    = useState<string | null>(null)
  const [openSubGroupId, setOpenSubGroupId] = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [submitting,     setSubmitting]     = useState(false)
  const [success,        setSuccess]        = useState(false)

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then((data: ServiceNode[]) => setServices(data))
      .catch(() => setError('Impossible de charger les services.'))
      .finally(() => setLoading(false))
  }, [])

  // Ouvre les groupes parents du service pré-sélectionné
  useEffect(() => {
    if (!selectedId || !services.length) return
    for (const group of services) {
      if (!group.children.length) continue
      const isThreeLevel = group.children[0]?.children.length > 0
      if (isThreeLevel) {
        for (const sub of group.children) {
          if (sub.children.some(leaf => leaf.id === selectedId)) {
            setOpenGroupId(group.id)
            setOpenSubGroupId(sub.id)
            return
          }
        }
      } else {
        if (group.children.some(leaf => leaf.id === selectedId)) {
          setOpenGroupId(group.id)
          return
        }
      }
    }
  }, [services, selectedId])

  function toggleGroup(id: string) {
    setOpenGroupId(prev => prev === id ? null : id)
    setOpenSubGroupId(null)
  }

  function toggleSubGroup(id: string) {
    setOpenSubGroupId(prev => prev === id ? null : id)
  }

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

              {/* Items plats — grille 2 colonnes */}
              {flatItems.length > 0 && (
                <div className="grid grid-cols-2 gap-[10px]">
                  {flatItems.map(node => (
                    <LeafButton
                      key={node.id}
                      node={node}
                      selected={selectedId === node.id}
                      onSelect={setSelectedId}
                    />
                  ))}
                </div>
              )}

              {/* Groupes expansibles */}
              {groupItems.map(group => {
                const groupOpen        = openGroupId === group.id
                const isThreeLevel     = group.children[0]?.children.length > 0
                const selectedLeafName = findSelectedLeafName(group, selectedId)

                return (
                  <div key={group.id} className="flex flex-col gap-1">
                    <GroupCard
                      group={group}
                      open={groupOpen}
                      selectedLeafName={selectedLeafName}
                      onToggle={() => toggleGroup(group.id)}
                    />
                    <Accordion open={groupOpen}>
                      <div className="pl-2 pt-1 pb-1 flex flex-col gap-[6px]">
                        {isThreeLevel ? (
                          group.children.map(sub => {
                            const subOpen = openSubGroupId === sub.id
                            return (
                              <div key={sub.id} className="flex flex-col gap-1">
                                <button
                                  onClick={() => toggleSubGroup(sub.id)}
                                  className="flex items-center gap-[10px] px-4 min-h-[44px] rounded-xl text-left w-full border-[1.5px] border-bordeaux/15 bg-bordeaux/[0.02] transition-[border-color] duration-[180ms]"
                                >
                                  <div className="w-4 h-4 rounded-[4px] shrink-0 border-2 border-bordeaux/40 bg-transparent" />
                                  <span className="flex-1 font-cormorant font-light text-bordeaux/80 tracking-[0.01em]" style={{ fontSize: 14 }}>
                                    {sub.name}
                                  </span>
                                  <Chevron open={subOpen} />
                                </button>
                                <Accordion open={subOpen}>
                                  <div className="grid grid-cols-2 gap-[6px] pl-2 pt-1 pb-1">
                                    {sub.children.map(leaf => (
                                      <LeafButton key={leaf.id} node={leaf} selected={selectedId === leaf.id} onSelect={setSelectedId} />
                                    ))}
                                  </div>
                                </Accordion>
                              </div>
                            )
                          })
                        ) : (
                          <div className="grid grid-cols-2 gap-[6px] pb-1">
                            {group.children.map(leaf => (
                              <LeafButton key={leaf.id} node={leaf} selected={selectedId === leaf.id} onSelect={setSelectedId} />
                            ))}
                          </div>
                        )}
                      </div>
                    </Accordion>
                  </div>
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
