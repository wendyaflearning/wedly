'use client'
import { useEffect, useRef, useState } from 'react'
import { Tooltip } from '@/app/components/Tooltip'
import type { RegionOption, VendorType, ZonesPricingData } from '../../types'

const PRICE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'per_service', label: 'Par prestation' },
  { value: 'per_person',  label: 'Par personne' },
  { value: 'per_hour',    label: 'Par heure' },
]

export default function ZonesPricingStep({
  token,
  initialData,
  vendorType,
  onBack,
  onNext,
}: {
  token: string
  initialData: ZonesPricingData | null
  vendorType: VendorType
  onBack: () => void
  onNext: (nextStep: string) => void
}) {
  const [regions, setRegions]               = useState<RegionOption[]>([])
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [regionIds, setRegionIds]           = useState<string[]>(initialData?.zones ?? [])
  const [priceMin, setPriceMin]             = useState<string>(initialData ? (initialData.price_min / 100).toString() : '')
  const [priceMax, setPriceMax]             = useState<string>(initialData ? (initialData.price_max / 100).toString() : '')
  const [priceType, setPriceType]           = useState<string | null>(initialData?.price_type ?? null)
  const [city, setCity]                     = useState<string>(initialData?.city ?? '')
  const [nearestCity, setNearestCity]       = useState<string>(initialData?.nearest_city ?? '')
  const [distanceMin, setDistanceMin]       = useState<string>(initialData?.distance_to_city_minutes?.toString() ?? '')
  const [submitting, setSubmitting]         = useState(false)
  const [success, setSuccess]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const dropdownRef                         = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => setRegions(data))
      .finally(() => setRegionsLoading(false))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isVenue = vendorType === 'lieu'

  const isValid =
    regionIds.length > 0 &&
    priceMin !== '' && priceMax !== '' &&
    priceType !== null &&
    (!isVenue || (city !== '' && nearestCity !== '' && distanceMin !== ''))

  async function handleConfirm() {
    if (!isValid || submitting || success) return
    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        price_min: Math.round(Number(priceMin) * 100),
        price_max: Math.round(Number(priceMax) * 100),
        price_type: priceType,
        zones: regionIds,
      }
      if (isVenue) {
        payload.city = city
        payload.nearest_city = nearestCity
        payload.distance_to_city_minutes = Number(distanceMin)
      }
      const res = await fetch(`/api/onboarding/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'zones_pricing', data: payload }),
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
            <span className="font-josefin uppercase text-bordeaux" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              Étape 4 / 7
            </span>
          </div>
        </div>

        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mt-8 mb-6" />

        {/* Barre de progression */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`w-8 h-[3px] rounded-full ${i < 4 ? 'bg-bordeaux' : 'bg-bordeaux/15'}`} />
          ))}
        </div>

        <div style={{ padding: '32px 32px 0' }}>

          {isVenue ? (
            /* ─── Variante LIEU ─── */
            <>
              <h2
                className="font-cormorant font-light text-bordeaux"
                style={{ fontSize: 'clamp(18px, 2.6vw, 28px)', lineHeight: 1.35, marginBottom: 28 }}
              >
                Où êtes-vous situé et à quel budget ?
              </h2>

              <span className="font-josefin uppercase text-bordeaux/50 block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 14, marginTop: 28 }}>
                3A — Localisation et tarifs
              </span>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.55)', marginBottom: 6 }}>
                    Ville
                  </label>
                  <input
                    placeholder="Ex : Paris, Lyon…"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 16px',
                      border: `1.5px solid ${city !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                      borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                      fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                      color: 'var(--color-bordeaux)', transition: 'border-color 0.2s',
                    }}
                  />
                </div>

                <div>
                  <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.55)', marginBottom: 6 }}>
                    Région
                  </label>
                  <div ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between font-cormorant"
                      style={{
                        padding: '13px 16px',
                        border: `1.5px solid ${regionIds.length > 0 ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                        borderRadius: dropdownOpen ? '10px 10px 0 0' : 10,
                        background: 'transparent', cursor: 'pointer', fontSize: 15,
                        color: regionIds.length > 0 ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.5)',
                      }}
                    >
                      <span>
                        {regionIds.length === 0
                          ? 'Sélectionner une région'
                          : (regions.find(r => r.id === regionIds[0])?.name ?? 'Sélectionner une région')}
                      </span>
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className="shrink-0"
                        style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <path d="M2 4l4 4 4-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div style={{ border: '1.5px solid var(--color-bordeaux)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: 'var(--color-creme)' }}>
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(78,26,50,0.10)' }}>
                          <input
                            type="text"
                            placeholder="Rechercher une région…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            autoFocus
                            style={{
                              width: '100%', padding: '8px 12px',
                              border: '1px solid rgba(78,26,50,0.20)',
                              borderRadius: 8, background: 'var(--color-creme)', outline: 'none',
                              fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 14,
                              color: 'var(--color-bordeaux)',
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {regionsLoading ? (
                            <div className="p-3">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h-5 rounded bg-bordeaux/10 mb-2.5 animate-pulse" />
                              ))}
                            </div>
                          ) : (() => {
                            const filtered = regions.filter(r =>
                              r.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            if (filtered.length === 0) {
                              return (
                                <p className="font-cormorant text-bordeaux/50 text-center" style={{ fontSize: 14, padding: '16px' }}>
                                  Aucune région trouvée
                                </p>
                              )
                            }
                            return filtered.map(region => {
                              const selected = regionIds[0] === region.id
                              return (
                                <button
                                  key={region.id}
                                  onClick={() => {
                                    setRegionIds(selected ? [] : [region.id])
                                    setDropdownOpen(false)
                                    setSearchQuery('')
                                  }}
                                  className="w-full flex items-center gap-3 text-left cursor-pointer"
                                  style={{
                                    padding: '11px 16px',
                                    background: selected ? 'rgba(78,26,50,0.05)' : 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(78,26,50,0.07)',
                                  }}
                                >
                                  <div
                                    className="shrink-0 flex items-center justify-center rounded-full"
                                    style={{
                                      width: 16, height: 16,
                                      border: selected ? '2px solid var(--color-bordeaux)' : '2px solid rgba(78,26,50,0.25)',
                                    }}
                                  >
                                    {selected && <div className="rounded-full bg-bordeaux" style={{ width: 8, height: 8 }} />}
                                  </div>
                                  <span className="font-cormorant text-bordeaux" style={{ fontSize: 15 }}>
                                    {region.name}
                                  </span>
                                </button>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge région sélectionnée */}
                  {regionIds.length > 0 && (() => {
                    const region = regions.find(r => r.id === regionIds[0])
                    if (!region) return null
                    return (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className="flex items-center gap-1.5 bg-bordeaux text-creme font-josefin uppercase"
                          style={{ fontSize: 10, letterSpacing: '0.07em', padding: '5px 10px', borderRadius: 20 }}
                        >
                          {region.name}
                          <button
                            onClick={() => setRegionIds([])}
                            className="flex items-center justify-center text-creme/70 hover:text-creme"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                            aria-label={`Retirer ${region.name}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </span>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <p className="font-cormorant text-texte/60" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 20, marginBottom: 10 }}>
                À combien de minutes de la ville la plus proche ?
              </p>
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="30"
                    value={distanceMin}
                    onChange={e => setDistanceMin(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 40px 13px 16px',
                      border: `1.5px solid ${distanceMin !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                      borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                      fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                      color: 'var(--color-bordeaux)', transition: 'border-color 0.2s',
                    }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-cormorant text-bordeaux/50" style={{ fontSize: 13 }}>
                    min
                  </span>
                </div>
                <input
                  placeholder="Ville de référence"
                  value={nearestCity}
                  onChange={e => setNearestCity(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 16px',
                    border: `1.5px solid ${nearestCity !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                    borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                    fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                    color: 'var(--color-bordeaux)', transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </>
          ) : (
            /* ─── Variante FREELANCE / TRAITEUR ─── */
            <>
              <h2
                className="font-cormorant font-light text-bordeaux"
                style={{ fontSize: 'clamp(18px, 2.6vw, 28px)', lineHeight: 1.35, marginBottom: 16 }}
              >
                Où intervenez-vous et à quel budget ?
              </h2>

              <div className="rounded-[10px] mb-7" style={{ background: 'rgba(78,26,50,0.03)', border: '1px solid rgba(78,26,50,0.125)', padding: '13px 17px' }}>
                <p className="font-cormorant font-light text-texte" style={{ fontSize: 14, lineHeight: 1.7 }}>
                  La fourchette tarifaire n&apos;est pas un engagement contractuel — elle aide les couples à se projeter et évite les contacts hors budget.
                </p>
              </div>

              <span className="font-josefin uppercase text-bordeaux/50 block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 14, marginTop: 28 }}>
                Zone d&apos;intervention
              </span>
              <p className="font-cormorant text-texte/60" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                Dans quelles zones intervenez-vous sans frais de déplacement ?
              </p>

              {/* Dropdown multi-select */}
              <div ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between font-cormorant"
                  style={{
                    padding: '13px 16px',
                    border: `1.5px solid ${regionIds.length > 0 ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                    borderRadius: dropdownOpen ? '10px 10px 0 0' : 10,
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 15,
                    color: regionIds.length > 0 ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.5)',
                  }}
                >
                  <span>
                    {regionIds.length === 0
                      ? 'Sélectionner vos régions'
                      : `${regionIds.length} région${regionIds.length > 1 ? 's' : ''} sélectionnée${regionIds.length > 1 ? 's' : ''}`}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="shrink-0"
                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div style={{ border: '1.5px solid var(--color-bordeaux)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: 'var(--color-creme)' }}>
                    {/* Champ de recherche */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(78,26,50,0.10)' }}>
                      <input
                        type="text"
                        placeholder="Rechercher une région…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%', padding: '8px 12px',
                          border: '1px solid rgba(78,26,50,0.20)',
                          borderRadius: 8, background: 'var(--color-creme)', outline: 'none',
                          fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 14,
                          color: 'var(--color-bordeaux)',
                        }}
                      />
                    </div>

                    {/* Liste filtrée */}
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {regionsLoading ? (
                        <div className="p-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-5 rounded bg-bordeaux/10 mb-2.5 animate-pulse" />
                          ))}
                        </div>
                      ) : (() => {
                        const filtered = regions.filter(r =>
                          r.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        if (filtered.length === 0) {
                          return (
                            <p className="font-cormorant text-bordeaux/50 text-center" style={{ fontSize: 14, padding: '16px' }}>
                              Aucune région trouvée
                            </p>
                          )
                        }
                        return filtered.map(region => {
                          const selected = regionIds.includes(region.id)
                          return (
                            <button
                              key={region.id}
                              onClick={() => setRegionIds(prev =>
                                selected ? prev.filter(id => id !== region.id) : [...prev, region.id]
                              )}
                              className="w-full flex items-center gap-3 text-left cursor-pointer"
                              style={{
                                padding: '11px 16px',
                                background: selected ? 'rgba(78,26,50,0.05)' : 'transparent',
                                border: 'none',
                                borderBottom: '1px solid rgba(78,26,50,0.07)',
                              }}
                            >
                              <div
                                className="shrink-0 flex items-center justify-center"
                                style={{
                                  width: 16, height: 16, borderRadius: 4,
                                  border: selected ? '2px solid var(--color-bordeaux)' : '2px solid rgba(78,26,50,0.25)',
                                  background: selected ? 'var(--color-bordeaux)' : 'transparent',
                                }}
                              >
                                {selected && (
                                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                    <path d="M1.5 4.5l2.5 2.5 3.5-4" stroke="var(--color-creme)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-cormorant text-bordeaux" style={{ fontSize: 15 }}>
                                {region.name}
                              </span>
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Badges des régions sélectionnées */}
              {regionIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {regionIds.map(id => {
                    const region = regions.find(r => r.id === id)
                    if (!region) return null
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1.5 bg-bordeaux text-creme font-josefin uppercase"
                        style={{ fontSize: 10, letterSpacing: '0.07em', padding: '5px 10px', borderRadius: 20 }}
                      >
                        {region.name}
                        <button
                          onClick={() => setRegionIds(prev => prev.filter(rid => rid !== id))}
                          className="flex items-center justify-center text-creme/70 hover:text-creme"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                          aria-label={`Retirer ${region.name}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Tarifs (commun) ── */}
          <span className="font-josefin uppercase text-bordeaux/50 block" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 14, marginTop: 28 }}>
            Tarifs
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.55)', marginBottom: 6 }}>
                À partir de
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 40px 13px 16px',
                    border: `1.5px solid ${priceMin !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                    borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                    fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                    color: 'var(--color-bordeaux)', transition: 'border-color 0.2s',
                  }}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-cormorant text-bordeaux/50" style={{ fontSize: 14 }}>
                  €
                </span>
              </div>
            </div>
            <div>
              <label className="font-josefin uppercase block" style={{ fontSize: 10, letterSpacing: '0.09em', color: 'rgba(41,26,16,0.55)', marginBottom: 6 }}>
                Jusqu&apos;à
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 40px 13px 16px',
                    border: `1.5px solid ${priceMax !== '' ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                    borderRadius: 10, background: 'var(--color-creme)', outline: 'none',
                    fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                    color: 'var(--color-bordeaux)', transition: 'border-color 0.2s',
                  }}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-cormorant text-bordeaux/50" style={{ fontSize: 14 }}>
                  €
                </span>
              </div>
            </div>
          </div>

          {/* ── Unité tarifaire ── */}
          <span className="font-josefin text-bordeaux/50 flex items-center gap-2" style={{ fontSize: 10, letterSpacing: '0.06em', marginBottom: 14, marginTop: 24 }}>
            Unité tarifaire
            <Tooltip text="L'unité tarifaire précise comment votre prix est calculé — par personne, par prestation, par heure... Elle varie selon votre métier." />
          </span>

          {isVenue ? (
            /* Radio buttons pour les lieux */
            <div className="flex flex-col gap-2">
              {PRICE_TYPE_OPTIONS.map(({ value, label }) => {
                const selected = priceType === value
                return (
                  <button
                    key={value}
                    onClick={() => setPriceType(value)}
                    className="flex items-center gap-3 text-left cursor-pointer"
                    style={{
                      padding: '14px 18px', borderRadius: 10,
                      background: selected ? 'rgba(78,26,50,0.06)' : 'transparent',
                      border: `1.5px solid ${selected ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                      transition: 'background 0.18s, border-color 0.18s',
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 16, height: 16, border: '2px solid var(--color-bordeaux)' }}
                    >
                      {selected && <div className="rounded-full bg-bordeaux" style={{ width: 8, height: 8 }} />}
                    </div>
                    <span className="font-cormorant font-light text-bordeaux" style={{ fontSize: 15, letterSpacing: '0.01em' }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Select dropdown pour freelance / traiteur */
            <div className="relative">
              <select
                value={priceType ?? ''}
                onChange={e => setPriceType(e.target.value || null)}
                style={{
                  width: '100%', padding: '13px 40px 13px 16px',
                  border: `1.5px solid ${priceType ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                  borderRadius: 10, background: 'transparent', outline: 'none',
                  fontFamily: 'var(--font-cormorant-var, Georgia, serif)', fontSize: 15,
                  color: priceType ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.45)',
                  transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Par prestation / par personne / par heure</option>
                {PRICE_TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <path d="M2 4l4 4 4-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {error && (
            <p className="font-josefin text-sm text-highlight text-center mt-4">{error}</p>
          )}

          <div style={{ marginTop: 28, marginBottom: 20 }}>
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
                transition: 'background 0.3s, opacity 0.2s, transform 0.15s',
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
