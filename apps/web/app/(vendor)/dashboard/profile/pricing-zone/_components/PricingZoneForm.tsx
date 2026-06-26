'use client'

import { useEffect, useRef, useState } from 'react'
import type { PricingZoneData } from '@/lib/pricingZone'

type RegionOption = { id: string; name: string }

type Snapshot = {
  priceFrom: string
  priceTo: string
  pricingUnit: string
  mainRegion: string
  departments: string[]
}

const PRICING_UNIT_OPTIONS = [
  { value: 'per_service', label: 'Par prestation' },
  { value: 'per_person',  label: 'Par personne' },
  { value: 'per_hour',    label: 'Par heure' },
]

export default function PricingZoneForm({
  vendorId,
  initialData,
}: {
  vendorId: string
  initialData: PricingZoneData | null
}) {
  const initPriceFrom  = initialData?.price_min != null ? String(Math.round(initialData.price_min / 100)) : ''
  const initPriceTo    = initialData?.price_max != null ? String(Math.round(initialData.price_max / 100)) : ''
  const initUnit       = initialData?.price_type  ?? ''
  const initRegion     = initialData?.zones?.[0]  ?? ''
  const initDepts      = initialData?.zones?.slice(1) ?? []

  const [priceFrom, setPriceFrom]         = useState(initPriceFrom)
  const [priceTo, setPriceTo]             = useState(initPriceTo)
  const [pricingUnit, setPricingUnit]     = useState(initUnit)
  const [mainRegion, setMainRegion]       = useState(initRegion)
  const [departments, setDepartments]     = useState<string[]>(initDepts)
  const [snapshot, setSnapshot]           = useState<Snapshot>({
    priceFrom: initPriceFrom,
    priceTo: initPriceTo,
    pricingUnit: initUnit,
    mainRegion: initRegion,
    departments: initDepts,
  })
  const [regions, setRegions]             = useState<RegionOption[]>([])
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [regionOpen, setRegionOpen]       = useState(false)
  const [deptOpen, setDeptOpen]           = useState(false)

  const regionRef = useRef<HTMLDivElement>(null)
  const deptRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetches: [Promise<RegionOption[]>, Promise<PricingZoneData | null>] = [
      fetch('/api/regions').then(r => r.json()),
      // Fallback client-side GET si le fetch serveur a échoué (initialData null)
      initialData === null
        ? fetch(`/api/vendors/${vendorId}/zone-pricing`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]
    Promise.all(fetches).then(([regionsData, pricingData]) => {
      setRegions(regionsData ?? [])
      // pricingData peut être [] (aucune donnée) ou null — on ignore dans les deux cas
      if (pricingData && !Array.isArray(pricingData)) {
        const pf    = pricingData.price_min != null ? String(Math.round(pricingData.price_min / 100)) : ''
        const pt    = pricingData.price_max != null ? String(Math.round(pricingData.price_max / 100)) : ''
        const pu    = pricingData.price_type  ?? ''
        const mr    = pricingData.zones?.[0]  ?? ''
        const depts = pricingData.zones?.slice(1) ?? []
        setPriceFrom(pf)
        setPriceTo(pt)
        setPricingUnit(pu)
        setMainRegion(mr)
        setDepartments(depts)
        setSnapshot({ priceFrom: pf, priceTo: pt, pricingUnit: pu, mainRegion: mr, departments: depts })
      }
    }).finally(() => setRegionsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false)
      }
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pricingUnitLabel = PRICING_UNIT_OPTIONS.find(o => o.value === pricingUnit)?.label ?? ''
  const selectedRegion   = regions.find(r => r.id === mainRegion)
  const availableDepts   = regions.filter(r => !departments.includes(r.id))

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/zone-pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            price_min:  priceFrom ? Math.round(Number(priceFrom) * 100) : 0,
            price_max:  priceTo   ? Math.round(Number(priceTo)   * 100) : 0,
            price_type: pricingUnit || null,
            zones:      [mainRegion, ...departments].filter(Boolean),
          },
        }),
      })
      if (!res.ok) {
        setError('Une erreur est survenue. Vos modifications ne sont pas enregistrées.')
        return
      }
      setSaved(true)
      setSnapshot({ priceFrom, priceTo, pricingUnit, mainRegion, departments: [...departments] })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setPriceFrom(snapshot.priceFrom)
    setPriceTo(snapshot.priceTo)
    setPricingUnit(snapshot.pricingUnit)
    setMainRegion(snapshot.mainRegion)
    setDepartments([...snapshot.departments])
    setError(null)
    setSaved(false)
  }

  const inputStyle = (filled: boolean): React.CSSProperties => ({
    padding: '13px 40px 13px 16px',
    border: `1.5px solid ${filled ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
    borderRadius: 10, background: 'transparent', outline: 'none',
    fontSize: 16, transition: 'border-color 0.2s',
  })

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-[72px] pb-6">

      <div className="md:grid md:grid-cols-2">

        {/* ── Colonne gauche : Fourchette de prix ── */}
        <div className="pt-10 md:pt-12 md:pr-12">
          <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-bordeaux/40 pb-4 mb-6 border-b border-bordeaux/10">
            FOURCHETTE DE PRIX
          </p>

          {/* price_from */}
          <div className="mb-5">
            <label className="block font-manrope text-[11px] font-semibold text-texte mb-2">
              Prestation à partir de
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={priceFrom}
                onChange={e => { setPriceFrom(e.target.value); setSaved(false) }}
                className="w-full font-cormorant text-bordeaux"
                style={inputStyle(!!priceFrom)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-cormorant text-bordeaux/50" style={{ fontSize: 15 }}>
                €
              </span>
            </div>
          </div>

          {/* price_to */}
          <div className="mb-5">
            <label className="block font-manrope text-[11px] font-semibold text-texte mb-2">
              Tarif maximum{' '}
              <span className="font-normal text-gris">optionnel</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={priceTo}
                onChange={e => { setPriceTo(e.target.value); setSaved(false) }}
                className="w-full font-cormorant text-bordeaux"
                style={inputStyle(!!priceTo)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-cormorant text-bordeaux/50" style={{ fontSize: 15 }}>
                €
              </span>
            </div>
          </div>

          {/* pricing_unit */}
          <div className="mb-8">
            <label className="block font-manrope text-[11px] font-semibold text-texte mb-2">
              Unité de tarification
            </label>
            <div className="relative">
              <select
                value={pricingUnit}
                onChange={e => { setPricingUnit(e.target.value); setSaved(false) }}
                className="w-full font-cormorant"
                style={{
                  ...inputStyle(!!pricingUnit),
                  appearance: 'none', cursor: 'pointer',
                  color: pricingUnit ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.45)',
                }}
              >
                <option value="">Sélectionner…</option>
                {PRICING_UNIT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <path d="M2 4l4 4 4-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Aperçu temps réel */}
          {priceFrom && (
            <div className="rounded-xl border border-bordeaux/10 px-5 py-4" style={{ background: 'rgba(78,26,50,0.02)' }}>
              <p className="font-manrope text-[10px] tracking-[0.1em] uppercase text-gris mb-2">
                Affiché comme fourchette indicative sur votre profil public.
              </p>
              <p className="font-cormorant italic text-bordeaux" style={{ fontSize: 17 }}>
                «{' '}
                {Number(priceFrom).toLocaleString('fr-FR')}
                {priceTo ? ` – ${Number(priceTo).toLocaleString('fr-FR')}` : ''}
                {' '}€
                {pricingUnitLabel ? ` · ${pricingUnitLabel}` : ''}
                {' '}»
              </p>
            </div>
          )}
        </div>

        {/* ── Colonne droite : Zone d'intervention ── */}
        <div className="pt-10 md:pt-12 md:pl-12 mt-8 border-t border-bordeaux/10 md:mt-0 md:border-t-0 md:border-l md:border-bordeaux/10">
          <p className="font-manrope text-[10px] tracking-[0.22em] uppercase text-bordeaux/40 pb-4 mb-6 border-b border-bordeaux/10">
            ZONE D&apos;INTERVENTION
          </p>

          {/* main_region */}
          <div className="mb-6">
            <label className="block font-manrope text-[11px] font-semibold text-texte mb-2">
              Région principale
            </label>
            <div ref={regionRef} className="relative">
              <button
                type="button"
                onClick={() => setRegionOpen(prev => !prev)}
                className="w-full flex items-center justify-between font-cormorant"
                style={{
                  padding: '13px 16px',
                  border: `1.5px solid ${mainRegion ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.25)'}`,
                  borderRadius: regionOpen ? '10px 10px 0 0' : 10,
                  background: 'transparent', cursor: 'pointer', fontSize: 16,
                  color: mainRegion ? 'var(--color-bordeaux)' : 'rgba(78,26,50,0.45)',
                }}
              >
                <span>{selectedRegion ? selectedRegion.name : 'Sélectionner une région'}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ transform: regionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2 4l4 4 4-4" stroke="var(--color-bordeaux)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {regionOpen && (
                <div
                  className="absolute left-0 right-0 z-20"
                  style={{
                    top: '100%',
                    border: '1.5px solid var(--color-bordeaux)', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', background: 'var(--color-creme)',
                    maxHeight: 220, overflowY: 'auto',
                  }}
                >
                  {regionsLoading
                    ? <div className="p-3">{[1, 2, 3].map(i => <div key={i} className="h-5 rounded bg-bordeaux/10 mb-2.5 animate-pulse" />)}</div>
                    : regions.map(region => {
                        const selected = mainRegion === region.id
                        return (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => { setMainRegion(selected ? '' : region.id); setRegionOpen(false); setSaved(false) }}
                            className="w-full flex items-center gap-3 text-left"
                            style={{ padding: '11px 16px', background: selected ? 'rgba(78,26,50,0.05)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(78,26,50,0.07)', cursor: 'pointer' }}
                          >
                            <div className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, border: selected ? '2px solid var(--color-bordeaux)' : '2px solid rgba(78,26,50,0.25)' }}>
                              {selected && <div className="rounded-full bg-bordeaux" style={{ width: 8, height: 8 }} />}
                            </div>
                            <span className="font-cormorant text-bordeaux" style={{ fontSize: 15 }}>{region.name}</span>
                          </button>
                        )
                      })
                  }
                </div>
              )}
            </div>
          </div>

          {/* departments */}
          <div>
            <label className="block font-manrope text-[11px] font-semibold text-texte mb-2">
              Départements couverts{' '}
              <span className="font-normal text-gris">optionnel</span>
            </label>

            {departments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {departments.map(id => {
                  const region = regions.find(r => r.id === id)
                  if (!region) return null
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 font-manrope text-bordeaux"
                      style={{ fontSize: 11, padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(78,26,50,0.25)', background: 'transparent' }}
                    >
                      {region.name}
                      <button
                        type="button"
                        onClick={() => { setDepartments(prev => prev.filter(d => d !== id)); setSaved(false) }}
                        className="flex items-center justify-center text-bordeaux/40 hover:text-bordeaux"
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

            <div ref={deptRef} className="relative inline-block">
              {availableDepts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeptOpen(prev => !prev)}
                  className="flex items-center gap-1.5 font-manrope text-highlight"
                  style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--color-highlight)', background: 'transparent', cursor: 'pointer' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Ajouter
                </button>
              )}

              {deptOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 20, background: 'var(--color-creme)', border: '1.5px solid var(--color-bordeaux)', borderRadius: 10, minWidth: 220, maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 20px rgba(78,26,50,0.10)' }}>
                  {regionsLoading
                    ? <div className="p-3">{[1, 2, 3].map(i => <div key={i} className="h-5 rounded bg-bordeaux/10 mb-2.5 animate-pulse" />)}</div>
                    : availableDepts.map(region => (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => { setDepartments(prev => [...prev, region.id]); setDeptOpen(false); setSaved(false) }}
                          className="w-full text-left font-cormorant text-bordeaux"
                          style={{ display: 'block', padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(78,26,50,0.07)', cursor: 'pointer', fontSize: 15 }}
                        >
                          {region.name}
                        </button>
                      ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error && <p className="font-manrope text-sm text-highlight mt-6">{error}</p>}
      {saved && !error && <p className="font-manrope text-sm text-accent mt-6">✓ Modifications enregistrées</p>}

      {/* CTAs — dans le flux, pas en fixed */}
      <div className="flex items-center gap-3 mt-10 pt-6 border-t border-bordeaux/10">
        <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="font-manrope text-bordeaux"
            style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid rgba(78,26,50,0.25)', fontSize: 13, fontWeight: 500, background: 'transparent', cursor: 'pointer' }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="font-manrope text-creme bg-accent"
          style={{ padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s' }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
