'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

interface Option {
  id: string
  name: string
}

interface MatchingConsentData {
  granted: boolean | null
  confession_ids: Option[]
  culture_ids: Option[]
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-50">
      <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SectionHeader({ label, locked }: { label: string; locked: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-manrope text-[10px] tracking-[0.22em] uppercase whitespace-nowrap flex items-center gap-1.5 text-bordeaux/40">
        {label}
        {locked && <LockIcon />}
      </span>
      <div className="flex-1 border-t border-bordeaux/[0.12]" />
    </div>
  )
}

export default function MatchingConsentForm({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const { toast, showToast } = useToast()

  const [granted, setGranted] = useState<boolean>(false)
  const [confessions, setConfessions] = useState<Option[]>([])
  const [cultures, setCultures] = useState<Option[]>([])
  const [selectedConfessionIds, setSelectedConfessionIds] = useState<string[]>([])
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>([])
  const [initialGranted, setInitialGranted] = useState<boolean>(false)
  const [initialConfessionIds, setInitialConfessionIds] = useState<string[]>([])
  const [initialCultureIds, setInitialCultureIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/confessions').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/cultures').then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/vendors/${vendorId}/matching-consent`).then(r => r.ok ? r.json() : Promise.reject()),
    ])
      .then(([confData, cultData, consentData]: [Option[], Option[], MatchingConsentData]) => {
        setConfessions(confData)
        setCultures(cultData)
        const g = consentData.granted === true
        const cIds = (consentData.confession_ids ?? []).map(c => c.id)
        const cuIds = (consentData.culture_ids ?? []).map(c => c.id)
        setGranted(g)
        setInitialGranted(g)
        setSelectedConfessionIds(cIds)
        setInitialConfessionIds(cIds)
        setSelectedCultureIds(cuIds)
        setInitialCultureIds(cuIds)
      })
      .catch(() => showToast('error', 'Impossible de charger les données.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  function toggleId(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  const isDirty =
    granted !== initialGranted ||
    [...selectedConfessionIds].sort().join(',') !== [...initialConfessionIds].sort().join(',') ||
    [...selectedCultureIds].sort().join(',') !== [...initialCultureIds].sort().join(',')

  function handleCancel() {
    setGranted(initialGranted)
    setSelectedConfessionIds([...initialConfessionIds])
    setSelectedCultureIds([...initialCultureIds])
  }

  function handleToggleGranted() {
    if (granted) {
      setGranted(false)
      setSelectedConfessionIds([])
      setSelectedCultureIds([])
    } else {
      setGranted(true)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/matching-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            granted,
            culture_ids: selectedCultureIds,
            confession_ids: selectedConfessionIds,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Une erreur est survenue.')
      }
      router.push('/dashboard/profile?saved=matching-consent')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
      setSubmitting(false)
    }
  }

  const pillBase = 'rounded-full px-4 py-2 font-cormorant font-light text-[15px] border transition-colors duration-[180ms]'
  const pillSelected = 'bg-bordeaux border-bordeaux text-creme'
  const pillUnselected = 'bg-transparent border-bordeaux/25 text-bordeaux hover:border-bordeaux/50'
  const skeletonWidths = [80, 70, 100, 65, 90, 75, 55]

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-[680px] mx-auto px-5 md:px-0 py-10 md:py-14 pb-32">

        {/* Toggle consent */}
        <div className="rounded-2xl bg-white border border-bordeaux/10 p-5 md:p-6 mb-10 md:mb-14">
          <div className="flex items-center justify-between gap-4">
            <span className="font-cormorant text-[17px] font-semibold text-bordeaux">
              Activer le matching culturel
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={granted}
              onClick={handleToggleGranted}
              disabled={loading}
              className={[
                'relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none',
                loading ? 'opacity-40 cursor-not-allowed' : '',
                granted ? 'bg-accent' : 'bg-bordeaux/20',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                  granted ? 'translate-x-6' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
          <p className="mt-3 font-manrope text-[13px] leading-relaxed text-texte/50">
            Ces informations sont utilisées uniquement pour le matching. Elles restent privées et ne sont jamais affichées sur votre profil public.
          </p>
        </div>

        {/* Confessions */}
        <section className={['mb-10 md:mb-14 transition-opacity duration-200', !granted ? 'opacity-40 pointer-events-none' : ''].join(' ')}>
          <SectionHeader label="Types de cérémonie" locked={!granted} />

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {skeletonWidths.map((w, i) => (
                <div key={i} className="h-9 rounded-full bg-bordeaux/10 animate-pulse" style={{ width: w }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {confessions.map(confession => (
                <button
                  key={confession.id}
                  type="button"
                  onClick={() => toggleId(selectedConfessionIds, setSelectedConfessionIds, confession.id)}
                  className={[pillBase, selectedConfessionIds.includes(confession.id) ? pillSelected : pillUnselected, 'cursor-pointer'].join(' ')}
                >
                  {confession.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Cultures */}
        <section className={['transition-opacity duration-200', !granted ? 'opacity-40 pointer-events-none' : ''].join(' ')}>
          <SectionHeader label="Univers & traditions culturelles" locked={!granted} />

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {skeletonWidths.map((w, i) => (
                <div key={i} className="h-9 rounded-full bg-bordeaux/10 animate-pulse" style={{ width: w }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cultures.map(culture => (
                <button
                  key={culture.id}
                  type="button"
                  onClick={() => toggleId(selectedCultureIds, setSelectedCultureIds, culture.id)}
                  className={[pillBase, selectedCultureIds.includes(culture.id) ? pillSelected : pillUnselected, 'cursor-pointer'].join(' ')}
                >
                  {culture.name}
                </button>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-creme border-t border-bordeaux/10 px-5 py-4 md:px-[72px] flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || submitting}
            className={[
              'shrink-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] border transition-colors duration-200',
              isDirty && !submitting
                ? 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                : 'border-bordeaux/15 text-bordeaux/30',
            ].join(' ')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isDirty || submitting}
            className={[
              'px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              isDirty && !submitting ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
      </footer>
    </>
  )
}
