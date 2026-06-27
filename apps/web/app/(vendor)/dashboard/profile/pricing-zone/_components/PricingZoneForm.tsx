'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
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

  const [priceFrom, setPriceFrom]           = useState(initPriceFrom)
  const [priceTo, setPriceTo]               = useState(initPriceTo)
  const [pricingUnit, setPricingUnit]       = useState(initUnit)
  const [mainRegion, setMainRegion]         = useState(initRegion)
  const [departments, setDepartments]       = useState<string[]>(initDepts)
  const [snapshot, setSnapshot]             = useState<Snapshot>({
    priceFrom: initPriceFrom,
    priceTo: initPriceTo,
    pricingUnit: initUnit,
    mainRegion: initRegion,
    departments: initDepts,
  })
  const [regions, setRegions]               = useState<RegionOption[]>([])
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [saving, setSaving]                 = useState(false)
  const { toast, showToast }                = useToast()
  const [regionOpen, setRegionOpen]         = useState(false)
  const [deptOpen, setDeptOpen]             = useState(false)

  const isDirty =
    priceFrom !== snapshot.priceFrom ||
    priceTo !== snapshot.priceTo ||
    pricingUnit !== snapshot.pricingUnit ||
    mainRegion !== snapshot.mainRegion ||
    JSON.stringify([...departments].sort()) !== JSON.stringify([...snapshot.departments].sort())

  const regionRef = useRef<HTMLDivElement>(null)
  const deptRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetches: [Promise<RegionOption[]>, Promise<PricingZoneData | null>] = [
      fetch('/api/regions').then(r => r.json()),
      initialData === null
        ? fetch(`/api/vendors/${vendorId}/zone-pricing`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]
    Promise.all(fetches).then(([regionsData, pricingData]) => {
      setRegions(regionsData ?? [])
      if (pricingData && !Array.isArray(pricingData)) {
        const pf    = pricingData.price_min != null ? String(Math.round(pricingData.price_min / 100)) : ''
        const pt    = pricingData.price_max != null ? String(Math.round(pricingData.price_max / 100)) : ''
        const pu    = pricingData.price_type  ?? ''
        const mr    = pricingData.zones?.[0]  ?? ''
        const depts = pricingData.zones?.slice(1) ?? []
        setPriceFrom(pf); setPriceTo(pt); setPricingUnit(pu)
        setMainRegion(mr); setDepartments(depts)
        setSnapshot({ priceFrom: pf, priceTo: pt, pricingUnit: pu, mainRegion: mr, departments: depts })
      }
    }).finally(() => setRegionsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setDeptOpen(false)
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
      if (!res.ok) { showToast('error', 'Une erreur est survenue. Vos modifications ne sont pas enregistrées.'); return }
      showToast('success', 'Tarifs & zone enregistrés ✓')
      setSnapshot({ priceFrom, priceTo, pricingUnit, mainRegion, departments: [...departments] })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setPriceFrom(snapshot.priceFrom); setPriceTo(snapshot.priceTo)
    setPricingUnit(snapshot.pricingUnit); setMainRegion(snapshot.mainRegion)
    setDepartments([...snapshot.departments])
  }

  const inputClass = (filled: boolean) =>
    `w-full rounded-xl border px-4 py-3 font-manrope text-[14px] text-texte bg-white outline-none transition-colors duration-150 ${
      filled ? 'border-bordeaux/40' : 'border-bordeaux/15 focus:border-bordeaux/40'
    }`

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-[1200px] mx-auto px-5 md:px-0 pb-32">
        <div className="md:grid md:grid-cols-2">

          {/* ── Colonne gauche : Fourchette de prix ── */}
          <div className="pt-10 md:pt-12 md:pr-12">
            <p className="font-manrope text-[10px] tracking-[0.22em] uppercase pb-4 mb-6 border-b border-bordeaux/10" style={{ color: 'rgba(78,26,50,0.4)' }}>
              FOURCHETTE DE PRIX
            </p>

            {/* price_from */}
            <div className="mb-5">
              <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Prestation à partir de
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={priceFrom}
                  onChange={e => { setPriceFrom(e.target.value) }}
                  className={inputClass(!!priceFrom)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-manrope text-[14px] text-gris">
                  €
                </span>
              </div>
            </div>

            {/* price_to */}
            <div className="mb-5">
              <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Tarif maximum{' '}
                <span className="normal-case tracking-normal text-gris">optionnel</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={priceTo}
                  onChange={e => { setPriceTo(e.target.value) }}
                  className={inputClass(!!priceTo)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-manrope text-[14px] text-gris">
                  €
                </span>
              </div>
            </div>

            {/* pricing_unit */}
            <div className="mb-8">
              <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Unité de tarification
              </label>
              <div className="relative">
                <select
                  value={pricingUnit}
                  onChange={e => { setPricingUnit(e.target.value) }}
                  className={[
                    inputClass(!!pricingUnit),
                    'appearance-none cursor-pointer',
                    !pricingUnit ? 'text-gris' : '',
                  ].join(' ')}
                >
                  <option value="">Sélectionner…</option>
                  {PRICING_UNIT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-bordeaux">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Aperçu temps réel */}
            {priceFrom && (
              <div className="rounded-xl border border-bordeaux/10 bg-bordeaux/[0.02] px-5 py-4">
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
            <p className="font-manrope text-[10px] tracking-[0.22em] uppercase pb-4 mb-6 border-b border-bordeaux/10" style={{ color: 'rgba(78,26,50,0.4)' }}>
              ZONE D&apos;INTERVENTION
            </p>

            {/* main_region */}
            <div className="mb-6">
              <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Région principale
              </label>
              <div ref={regionRef} className="relative">
                <button
                  type="button"
                  onClick={() => setRegionOpen(prev => !prev)}
                  className={[
                    'w-full flex items-center justify-between font-manrope text-[14px] rounded-xl border px-4 py-3 bg-white transition-colors duration-150 cursor-pointer',
                    mainRegion ? 'text-texte border-bordeaux/40' : 'text-gris border-bordeaux/15',
                    regionOpen ? 'rounded-b-none' : '',
                  ].join(' ')}
                >
                  <span>{selectedRegion ? selectedRegion.name : 'Sélectionner une région'}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="shrink-0 text-bordeaux transition-transform duration-200"
                    style={{ transform: regionOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {regionOpen && (
                  <div className="absolute left-0 right-0 z-20 bg-creme border border-t-0 border-bordeaux/40 rounded-b-xl overflow-hidden" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {regionsLoading
                      ? <div className="p-3 space-y-2.5">{[1, 2, 3].map(i => <div key={i} className="h-5 rounded bg-bordeaux/10 animate-pulse" />)}</div>
                      : regions.map(region => {
                          const selected = mainRegion === region.id
                          return (
                            <button
                              key={region.id}
                              type="button"
                              onClick={() => { setMainRegion(selected ? '' : region.id); setRegionOpen(false) }}
                              className={[
                                'w-full flex items-center gap-3 text-left px-4 py-[11px] border-b border-bordeaux/[0.07] transition-colors',
                                selected ? 'bg-bordeaux/5' : 'bg-transparent hover:bg-bordeaux/[0.02]',
                              ].join(' ')}
                            >
                              <div className={[
                                'shrink-0 flex items-center justify-center rounded-full w-4 h-4 border-2',
                                selected ? 'border-bordeaux' : 'border-bordeaux/25',
                              ].join(' ')}>
                                {selected && <div className="w-2 h-2 rounded-full bg-bordeaux" />}
                              </div>
                              <span className="font-manrope text-[14px] text-texte">{region.name}</span>
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
              <label className="block font-manrope text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Départements couverts{' '}
                <span className="normal-case tracking-normal text-gris">optionnel</span>
              </label>

              {departments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {departments.map(id => {
                    const region = regions.find(r => r.id === id)
                    if (!region) return null
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1.5 font-manrope text-[11px] text-bordeaux px-3 py-1.5 rounded-full border border-bordeaux/25"
                      >
                        {region.name}
                        <button
                          type="button"
                          onClick={() => { setDepartments(prev => prev.filter(d => d !== id)) }}
                          className="flex items-center justify-center text-bordeaux/40 hover:text-bordeaux transition-colors"
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
                    className="flex items-center gap-1.5 font-manrope text-[12px] font-medium text-accent border border-accent/50 px-4 py-1.5 rounded-full hover:bg-accent/5 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Ajouter
                  </button>
                )}

                {deptOpen && (
                  <div className="absolute left-0 z-20 mt-2 bg-creme border border-bordeaux/40 rounded-xl overflow-hidden shadow-sm" style={{ minWidth: 220, maxHeight: 220, overflowY: 'auto' }}>
                    {regionsLoading
                      ? <div className="p-3 space-y-2.5">{[1, 2, 3].map(i => <div key={i} className="h-5 rounded bg-bordeaux/10 animate-pulse" />)}</div>
                      : availableDepts.map(region => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => { setDepartments(prev => [...prev, region.id]); setDeptOpen(false) }}
                            className="w-full text-left font-manrope text-[14px] text-texte px-4 py-[10px] border-b border-bordeaux/[0.07] hover:bg-bordeaux/[0.02] transition-colors"
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

      </div>

      <footer className="sticky bottom-0 bg-creme border-t border-bordeaux/10 px-5 py-4 md:px-[72px]">
        <div className="flex gap-3 max-w-[1200px] mx-auto">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className={[
              'shrink-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] border transition-colors duration-200',
              isDirty && !saving
                ? 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                : 'border-bordeaux/15 text-bordeaux/30',
            ].join(' ')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              isDirty && !saving ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </footer>
    </>
  )
}
