'use client'
import { useState, useEffect } from 'react'

interface CateringData {
  covers_min: number | null
  covers_max: number | null
  is_kosher: boolean
  is_halal: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_offers_table_service: boolean
  is_offers_buffet: boolean
  is_offers_cocktail: boolean
  is_provide_tableware: boolean
  is_provide_furniture: boolean
}

interface FormState {
  isKosher: boolean
  isHalal: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isOffersTableService: boolean
  isOffersBuffet: boolean
  isOffersCocktail: boolean
  isProvideTableware: boolean
  isProvideFurniture: boolean
  coversMin: string
  coversMax: string
}

function mapToState(data: CateringData): FormState {
  return {
    isKosher: data.is_kosher,
    isHalal: data.is_halal,
    isVegan: data.is_vegan,
    isGlutenFree: data.is_gluten_free,
    isOffersTableService: data.is_offers_table_service,
    isOffersBuffet: data.is_offers_buffet,
    isOffersCocktail: data.is_offers_cocktail,
    isProvideTableware: data.is_provide_tableware,
    isProvideFurniture: data.is_provide_furniture,
    coversMin: data.covers_min != null ? String(data.covers_min) : '',
    coversMax: data.covers_max != null ? String(data.covers_max) : '',
  }
}

function statesEqual(a: FormState, b: FormState): boolean {
  return (
    a.isKosher === b.isKosher &&
    a.isHalal === b.isHalal &&
    a.isVegan === b.isVegan &&
    a.isGlutenFree === b.isGlutenFree &&
    a.isOffersTableService === b.isOffersTableService &&
    a.isOffersBuffet === b.isOffersBuffet &&
    a.isOffersCocktail === b.isOffersCocktail &&
    a.isProvideTableware === b.isProvideTableware &&
    a.isProvideFurniture === b.isProvideFurniture &&
    a.coversMin === b.coversMin &&
    a.coversMax === b.coversMax
  )
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

function CheckboxCard({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        'flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors duration-[180ms] text-left',
        checked ? 'border-bordeaux bg-creme' : 'border-bordeaux/15 bg-transparent',
      ].join(' ')}
    >
      <span
        className={[
          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-[180ms]',
          checked ? 'bg-bordeaux border-bordeaux' : 'bg-transparent border-bordeaux/30',
        ].join(' ')}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L4 7L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="font-cormorant font-light text-[15px] text-bordeaux">{label}</span>
    </button>
  )
}

const EMPTY_STATE: FormState = {
  isKosher: false,
  isHalal: false,
  isVegan: false,
  isGlutenFree: false,
  isOffersTableService: false,
  isOffersBuffet: false,
  isOffersCocktail: false,
  isProvideTableware: false,
  isProvideFurniture: false,
  coversMin: '',
  coversMax: '',
}

export default function CateringCharacteristicsForm({ vendorId }: { vendorId: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_STATE)
  const [snapshot, setSnapshot] = useState<FormState>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/catering-characteristics`)
      .then(r => r.json())
      .then((data: CateringData) => {
        const initial = mapToState(data)
        setForm(initial)
        setSnapshot(initial)
      })
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [vendorId])

  const isDirty = !statesEqual(form, snapshot)

  function toggle(field: keyof FormState) {
    setForm(prev => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/catering-characteristics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            is_kosher: form.isKosher,
            is_halal: form.isHalal,
            is_vegan: form.isVegan,
            is_gluten_free: form.isGlutenFree,
            is_offers_table_service: form.isOffersTableService,
            is_offers_buffet: form.isOffersBuffet,
            is_offers_cocktail: form.isOffersCocktail,
            is_provide_tableware: form.isProvideTableware,
            is_provide_furniture: form.isProvideFurniture,
            covers_min: form.coversMin === '' ? null : Number(form.coversMin),
            covers_max: form.coversMax === '' ? null : Number(form.coversMax),
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Une erreur est survenue.')
      }
      setSnapshot({ ...form })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setForm({ ...snapshot })
  }

  const skeletonWidths = [120, 100, 130, 110]

  return (
    <>
      <div className="max-w-[860px] mx-auto px-5 md:px-[72px] py-10 md:py-14 pb-32">

        {/* Régimes & certifications */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Régimes & certifications" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Les régimes alimentaires que vous pouvez accommoder.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skeletonWidths.map((w, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/8 animate-pulse" style={{ width: '100%', minWidth: w }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxCard label="Casher" checked={form.isKosher} onChange={() => toggle('isKosher')} />
              <CheckboxCard label="Halal" checked={form.isHalal} onChange={() => toggle('isHalal')} />
              <CheckboxCard label="Vegan" checked={form.isVegan} onChange={() => toggle('isVegan')} />
              <CheckboxCard label="Sans gluten" checked={form.isGlutenFree} onChange={() => toggle('isGlutenFree')} />
            </div>
          )}
        </section>

        {/* Formats de service */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Formats de service" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Les types de prestation que vous proposez.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[130, 100, 110].map((w, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/8 animate-pulse" style={{ width: '100%', minWidth: w }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxCard label="Service à table" checked={form.isOffersTableService} onChange={() => toggle('isOffersTableService')} />
              <CheckboxCard label="Buffet" checked={form.isOffersBuffet} onChange={() => toggle('isOffersBuffet')} />
              <CheckboxCard label="Cocktail" checked={form.isOffersCocktail} onChange={() => toggle('isOffersCocktail')} />
            </div>
          )}
        </section>

        {/* Matériel fourni */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Matériel fourni" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Le matériel inclus dans votre prestation.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[120, 110].map((w, i) => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/8 animate-pulse" style={{ width: '100%', minWidth: w }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxCard label="Vaisselle" checked={form.isProvideTableware} onChange={() => toggle('isProvideTableware')} />
              <CheckboxCard label="Mobilier" checked={form.isProvideFurniture} onChange={() => toggle('isProvideFurniture')} />
            </div>
          )}
        </section>

        {/* Capacité */}
        <section>
          <SectionHeader label="Capacité" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Le nombre de couverts que vous pouvez assurer. Champs facultatifs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Couverts minimum
              </label>
              <div className="flex items-center border rounded-xl px-4 py-3" style={{ borderColor: 'rgba(78,26,50,0.15)' }}>
                <input
                  type="number"
                  min={0}
                  value={form.coversMin}
                  onChange={e => setForm(prev => ({ ...prev, coversMin: e.target.value }))}
                  className="flex-1 bg-transparent font-cormorant text-[15px] text-bordeaux outline-none placeholder:text-bordeaux/25"
                  placeholder="—"
                />
                <span className="font-manrope text-[12px] ml-2 shrink-0" style={{ color: 'rgba(41,26,16,0.35)' }}>couverts</span>
              </div>
            </div>
            <div>
              <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                Couverts maximum
              </label>
              <div className="flex items-center border rounded-xl px-4 py-3" style={{ borderColor: 'rgba(78,26,50,0.15)' }}>
                <input
                  type="number"
                  min={0}
                  value={form.coversMax}
                  onChange={e => setForm(prev => ({ ...prev, coversMax: e.target.value }))}
                  className="flex-1 bg-transparent font-cormorant text-[15px] text-bordeaux outline-none placeholder:text-bordeaux/25"
                  placeholder="—"
                />
                <span className="font-manrope text-[12px] ml-2 shrink-0" style={{ color: 'rgba(41,26,16,0.35)' }}>couverts</span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <p className="font-manrope text-[13px] text-highlight text-center mt-8">{error}</p>
        )}
      </div>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-creme border-t px-5 py-4 md:px-[72px]" style={{ borderColor: 'rgba(78,26,50,0.10)' }}>
        <div className="flex gap-3 max-w-[860px] mx-auto md:justify-end">
          <button
              onClick={handleCancel}
              disabled={!isDirty || submitting}
              className={[
                'shrink-0 px-6 py-3 rounded-full font-manrope text-[12px] tracking-[0.06em] border transition-colors duration-200',
                isDirty && !submitting
                    ? 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
                    : 'border-bordeaux/15 text-bordeaux/30',
              ].join(' ')}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isDirty || submitting || success}
            className={[
              'grow md:grow-0 px-6 py-3 rounded-full font-manrope text-[12px] tracking-[0.12em] uppercase text-creme transition-colors duration-200',
              isDirty && !submitting && !success ? 'bg-bordeaux' : 'bg-bordeaux/20',
            ].join(' ')}
          >
            {submitting ? 'Enregistrement…' : success ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </footer>
    </>
  )
}
