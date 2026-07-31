'use client'
import { useState, useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

interface ExperienceOption {
  id: string
  name: string
}

interface ExperiencesData {
  confession_ids: ExperienceOption[]
  culture_ids: ExperienceOption[]
}

interface MatchingConsentData {
  granted: boolean | null
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
  const [granted, setGranted] = useState(false)
  const [initialGranted, setInitialGranted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch('/api/confessions').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/cultures').then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/vendors/${vendorId}/experiences`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/vendors/${vendorId}/matching-consent`).then(r => r.ok ? r.json() : Promise.reject()),
    ])
      .then(([confData, cultData, expData, consentData]: [ExperienceOption[], ExperienceOption[], ExperiencesData, MatchingConsentData]) => {
        setConfessions(confData)
        setCultures(cultData)
        const cIds = (expData?.confession_ids ?? []).map(c => c.id)
        const cuIds = (expData?.culture_ids ?? []).map(c => c.id)
        setSelectedConfessionIds(cIds)
        setInitialConfessionIds(cIds)
        setSelectedCultureIds(cuIds)
        setInitialCultureIds(cuIds)
        const g = consentData?.granted === true
        setGranted(g)
        setInitialGranted(g)
      })
      .catch(() => showToast('error', 'Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [vendorId])

  function toggleId(ids: string[], setIds: (v: string[]) => void, id: string) {
    setIds(ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
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

  const isDirty =
    granted !== initialGranted ||
    [...selectedConfessionIds].sort().join(',') !== [...initialConfessionIds].sort().join(',') ||
    [...selectedCultureIds].sort().join(',') !== [...initialCultureIds].sort().join(',')

  async function handleSubmit() {
    setSubmitting(true)

    // Le consentement retiré est géré par /matching-consent (vidage sans validation côté back).
    // /experiences exige au moins une culture/confession dès qu'on l'appelle — on ne l'appelle
    // donc que si le consentement est actif.
    if (granted) {
      let experiencesRes: Response
      try {
        experiencesRes = await fetch(`/api/vendors/${vendorId}/experiences`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              confession_ids: selectedConfessionIds,
              culture_ids: selectedCultureIds,
            }
          }),
        })
      } catch {
        showToast('error', 'Erreur lors de la sauvegarde de vos expériences.')
        setSubmitting(false)
        return
      }
      if (!experiencesRes.ok) {
        const data = await experiencesRes.json().catch(() => null)
        showToast('error', data?.error ?? 'Erreur lors de la sauvegarde de vos expériences.')
        setSubmitting(false)
        return
      }
      setInitialConfessionIds([...selectedConfessionIds])
      setInitialCultureIds([...selectedCultureIds])
    }

    if (granted !== initialGranted) {
      const consentErrorMessage = granted
        ? "Vos expériences sont enregistrées, mais le consentement n'a pas pu être sauvegardé — réessayez."
        : "Le consentement n'a pas pu être désactivé — réessayez."

      let consentRes: Response
      try {
        consentRes = await fetch(`/api/vendors/${vendorId}/matching-consent`, {
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
      } catch {
        showToast('error', consentErrorMessage)
        setSubmitting(false)
        return
      }
      if (!consentRes.ok) {
        showToast('error', consentErrorMessage)
        setSubmitting(false)
        return
      }
      setInitialGranted(granted)
      if (!granted) {
        setInitialConfessionIds([])
        setInitialCultureIds([])
      }
    }

    showToast('success', 'Expériences enregistrées ✓')
    setSubmitting(false)
  }

  function handleCancel() {
    setSelectedConfessionIds([...initialConfessionIds])
    setSelectedCultureIds([...initialCultureIds])
    setGranted(initialGranted)
  }

  const pillBase = 'rounded-full px-4 py-2 font-cormorant font-light text-[15px] border transition-colors duration-[180ms] cursor-pointer'
  const pillSelected = 'bg-bordeaux border-bordeaux text-creme'
  const pillUnselected = 'bg-transparent border-bordeaux/25 text-bordeaux hover:border-bordeaux/50'

  const skeletonWidths = [80, 70, 100, 65, 90, 75, 55]

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-[860px] mx-auto px-5 md:px-0 py-10 md:py-14 pb-32">

        {!loading && (
          <div className="rounded-2xl bg-white border border-bordeaux/10 p-5 md:p-6 mb-10 md:mb-14">
            <p className={['font-cormorant text-[17px] font-semibold mb-3 transition-colors duration-200', granted ? 'text-bordeaux/40' : 'text-bordeaux'].join(' ')}>
              Partagez vos expériences de mariage
            </p>
            <p className={['font-manrope text-[13px] leading-relaxed mb-5 transition-colors duration-200', granted ? 'text-texte/30' : 'text-texte/50'].join(' ')}>
              Cette section recueille votre consentement pour partager les expériences de mariage culturelles ou confessionnelles que vous avez pu accompagner. En l&apos;activant, vous acceptez d&apos;être positionné sur ces critères dans nos recommandations aux couples. Si vous préférez ne pas l&apos;activer, aucune pénalité : vos autres critères de matching restent inchangés, vous n&apos;êtes simplement pas positionné sur celui-ci.
            </p>
            <button
              type="button"
              onClick={handleToggleGranted}
              className={[
                'px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
                granted ? 'bg-bordeaux/20' : 'bg-accent',
              ].join(' ')}
            >
              {granted ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        )}

        {(loading || granted) && (
          <>
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
                    <span className="hidden md:inline">Contactez-nous : contact@wedly-apps.com</span>
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
          </>
        )}

      </div>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-creme border-t px-5 py-4 md:px-[72px]" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
        <div className="flex gap-3 max-w-[860px] mx-auto">
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
          <button
            onClick={handleSubmit}
            disabled={!isDirty || submitting}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[13px] tracking-[0.06em] text-creme transition-colors duration-200',
              isDirty && !submitting ? 'bg-accent' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </footer>
    </>
  )
}
