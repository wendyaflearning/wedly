'use client'
import { useState, useEffect } from 'react'

interface ExperienceOption {
  id: string
  name: string
}

interface ExperiencesData {
  confession_ids: ExperienceOption[]
  culture_ids: ExperienceOption[]
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="font-manrope text-[10px] tracking-[0.22em] uppercase whitespace-nowrap"
        style={{ color: 'rgba(78,26,50,0.4)' }}
      >
        {label}
      </span>
      <div className="flex-1 border-t" style={{ borderColor: 'rgba(78,26,50,0.12)' }} />
    </div>
  )
}

export default function ExperiencesForm({ vendorId }: { vendorId: string }) {
  const [confessions, setConfessions] = useState<ExperienceOption[]>([])
  const [cultures, setCultures] = useState<ExperienceOption[]>([])
  const [selectedConfessionIds, setSelectedConfessionIds] = useState<string[]>([])
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>([])
  const [initialConfessionIds, setInitialConfessionIds] = useState<string[]>([])
  const [initialCultureIds, setInitialCultureIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/confessions').then(r => r.json()),
      fetch('/api/cultures').then(r => r.json()),
      fetch(`/api/vendors/${vendorId}/experiences`).then(r => r.json()),
    ])
      .then(([confData, cultData, expData]: [ExperienceOption[], ExperienceOption[], ExperiencesData]) => {
        setConfessions(confData)
        setCultures(cultData)
        const cIds = (expData?.confession_ids ?? []).map(c => c.id)
        const cuIds = (expData?.culture_ids ?? []).map(c => c.id)
        setSelectedConfessionIds(cIds)
        setInitialConfessionIds(cIds)
        setSelectedCultureIds(cuIds)
        setInitialCultureIds(cuIds)
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [vendorId])

  function toggleId(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  const isDirty =
    [...selectedConfessionIds].sort().join(',') !== [...initialConfessionIds].sort().join(',') ||
    [...selectedCultureIds].sort().join(',') !== [...initialCultureIds].sort().join(',')

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/experiences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            confession_ids: selectedConfessionIds,
            culture_ids: selectedCultureIds,
          }
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Une erreur est survenue.')
      }
      setInitialConfessionIds([...selectedConfessionIds])
      setInitialCultureIds([...selectedCultureIds])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setSelectedConfessionIds([...initialConfessionIds])
    setSelectedCultureIds([...initialCultureIds])
  }

  const pillBase = 'rounded-full px-4 py-2 font-cormorant font-light text-[15px] border transition-colors duration-[180ms] cursor-pointer'
  const pillSelected = 'bg-bordeaux border-bordeaux text-creme'
  const pillUnselected = 'bg-transparent border-bordeaux/25 text-bordeaux hover:border-bordeaux/50'

  const skeletonWidths = [80, 70, 100, 65, 90, 75, 55]

  return (
    <>
      <div className="max-w-[860px] mx-auto px-5 md:px-[72px] py-10 md:py-14 pb-32">

        {/* Types de cérémonies */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Types de cérémonies" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Les formats de mariage pour lesquels vous intervenez habituellement.
          </p>

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
                  onClick={() => toggleId(selectedConfessionIds, setSelectedConfessionIds, confession.id)}
                  className={[pillBase, selectedConfessionIds.includes(confession.id) ? pillSelected : pillUnselected].join(' ')}
                >
                  {confession.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5" style={{ fontFamily: 'var(--font-manrope-var)', fontSize: 13, color: 'rgba(41,26,16,0.5)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-px">
              <circle cx="7" cy="7" r="6" stroke="rgba(78,26,50,0.35)" strokeWidth="1.2" />
              <text x="7" y="11" textAnchor="middle" fontSize="8" fill="rgba(78,26,50,0.5)" fontFamily="serif" fontStyle="italic">i</text>
            </svg>
            <span>
              Vous ne retrouvez pas votre confession ?{' '}
              <a href="mailto:contact@wedly.fr" className="text-accent hover:underline underline-offset-2">
                <span className="md:hidden">Contactez-nous</span>
                <span className="hidden md:inline">Contactez-nous : contact@wedly.fr</span>
              </a>
            </span>
          </div>
        </section>

        {/* Traditions & cultures */}
        <section>
          <SectionHeader label="Traditions & cultures" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Les backgrounds culturels avec lesquels vous avez de l&apos;expérience.
          </p>

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
                  onClick={() => toggleId(selectedCultureIds, setSelectedCultureIds, culture.id)}
                  className={[pillBase, selectedCultureIds.includes(culture.id) ? pillSelected : pillUnselected].join(' ')}
                >
                  {culture.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {error && (
          <p className="font-manrope text-[13px] text-highlight text-center mt-8">{error}</p>
        )}
      </div>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-creme border-t px-5 py-4 md:px-[72px]" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
        <div className="flex gap-3 max-w-[860px] mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isDirty || submitting || success}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              isDirty && !submitting && !success ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {submitting ? 'Enregistrement…' : success ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button
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
        </div>
      </footer>
    </>
  )
}
