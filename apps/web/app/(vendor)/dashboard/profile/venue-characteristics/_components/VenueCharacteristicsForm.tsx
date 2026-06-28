'use client'
import { useState, useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

interface VenueData {
  venue_type: string | null
  capacity_min: number | null
  capacity_max: number | null
  has_catering: boolean
  has_accommodation: boolean
  has_outdoor_space: boolean
  has_corkage_fee: boolean
  has_toilets: boolean
  is_pmr_accessible: boolean
  distance_to_city_minutes: number | null
  nearest_city: string | null
}

interface FormState {
  venueType: string
  capacityMin: string
  capacityMax: string
  hasCatering: boolean
  hasAccommodation: boolean
  hasOutdoorSpace: boolean
  hasCorkageFee: boolean
  hasToilets: boolean
  isPmrAccessible: boolean
  distanceToCity: string
  nearestCity: string
}

const VENUE_TYPES: { value: string; label: string }[] = [
  { value: 'chateau',   label: 'Château' },
  { value: 'domaine',   label: 'Domaine' },
  { value: 'salle',     label: 'Salle' },
  { value: 'loft',      label: 'Loft' },
  { value: 'grange',    label: 'Grange' },
  { value: 'plein_air', label: 'Plein air' },
]

const EQUIPMENT_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: 'hasCatering',      label: 'Restauration sur place' },
  { key: 'hasAccommodation', label: 'Hébergement' },
  { key: 'hasOutdoorSpace',  label: 'Espace extérieur' },
  { key: 'hasCorkageFee',    label: 'Droit de bouchon' },
  { key: 'isPmrAccessible',  label: 'Accessible PMR' },
  { key: 'hasToilets',       label: 'Sanitaires sur place' },
]

function mapToState(data: VenueData): FormState {
  return {
    venueType:      data.venue_type ?? '',
    capacityMin:    data.capacity_min != null ? String(data.capacity_min) : '',
    capacityMax:    data.capacity_max != null ? String(data.capacity_max) : '',
    hasCatering:    data.has_catering,
    hasAccommodation: data.has_accommodation,
    hasOutdoorSpace: data.has_outdoor_space,
    hasCorkageFee:  data.has_corkage_fee,
    hasToilets:     data.has_toilets,
    isPmrAccessible: data.is_pmr_accessible,
    distanceToCity: data.distance_to_city_minutes != null ? String(data.distance_to_city_minutes) : '',
    nearestCity:    data.nearest_city ?? '',
  }
}

function statesEqual(a: FormState, b: FormState): boolean {
  return (
    a.venueType === b.venueType &&
    a.capacityMin === b.capacityMin &&
    a.capacityMax === b.capacityMax &&
    a.hasCatering === b.hasCatering &&
    a.hasAccommodation === b.hasAccommodation &&
    a.hasOutdoorSpace === b.hasOutdoorSpace &&
    a.hasCorkageFee === b.hasCorkageFee &&
    a.hasToilets === b.hasToilets &&
    a.isPmrAccessible === b.isPmrAccessible &&
    a.distanceToCity === b.distanceToCity &&
    a.nearestCity === b.nearestCity
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

function NumberInput({
  value,
  onChange,
  suffix,
  placeholder = '—',
}: {
  value: string
  onChange: (v: string) => void
  suffix: string
  placeholder?: string
}) {
  return (
    <div className="flex items-center border rounded-xl px-3 py-3 overflow-hidden" style={{ borderColor: 'rgba(78,26,50,0.15)' }}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent font-cormorant text-[15px] text-bordeaux outline-none placeholder:text-bordeaux/25"
        placeholder={placeholder}
      />
      <span className="font-manrope text-[11px] ml-1.5 shrink-0" style={{ color: 'rgba(41,26,16,0.35)' }}>
        {suffix}
      </span>
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center border rounded-xl px-3 py-3 overflow-hidden" style={{ borderColor: 'rgba(78,26,50,0.15)' }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent font-cormorant text-[15px] text-bordeaux outline-none placeholder:text-bordeaux/25"
        placeholder={placeholder}
      />
    </div>
  )
}

const EMPTY_STATE: FormState = {
  venueType: '',
  capacityMin: '',
  capacityMax: '',
  hasCatering: false,
  hasAccommodation: false,
  hasOutdoorSpace: false,
  hasCorkageFee: false,
  hasToilets: false,
  isPmrAccessible: false,
  distanceToCity: '',
  nearestCity: '',
}

export default function VenueCharacteristicsForm({ vendorId }: { vendorId: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_STATE)
  const [snapshot, setSnapshot] = useState<FormState>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/venue-characteristics`)
      .then(r => r.json())
      .then((data: VenueData) => {
        const initial = mapToState(data)
        setForm(initial)
        setSnapshot(initial)
      })
      .catch(() => showToast('error', 'Impossible de charger les données.'))
      .finally(() => setLoading(false))
  }, [vendorId])

  const isDirty = !statesEqual(form, snapshot)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleBool(key: keyof FormState) {
    setForm(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${vendorId}/venue-characteristics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            venue_type:              form.venueType || null,
            capacity_min:            form.capacityMin === '' ? null : Number(form.capacityMin),
            capacity_max:            form.capacityMax === '' ? null : Number(form.capacityMax),
            has_catering:            form.hasCatering,
            has_accommodation:       form.hasAccommodation,
            has_outdoor_space:       form.hasOutdoorSpace,
            has_corkage_fee:         form.hasCorkageFee,
            has_toilets:             form.hasToilets,
            is_pmr_accessible:       form.isPmrAccessible,
            distance_to_city_minutes: form.distanceToCity === '' ? null : Number(form.distanceToCity),
            nearest_city:            form.nearestCity || null,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Une erreur est survenue.')
      }
      setSnapshot({ ...form })
      showToast('success', 'Caractéristiques enregistrées ✓')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setForm({ ...snapshot })
  }

  const pillBase = 'rounded-full px-4 py-2 font-cormorant font-light text-[15px] border transition-colors duration-[180ms] cursor-pointer'
  const pillSelected = 'bg-bordeaux border-bordeaux text-creme'
  const pillUnselected = 'bg-transparent border-bordeaux/25 text-bordeaux hover:border-bordeaux/50'

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-[860px] mx-auto px-5 md:px-0 py-10 md:py-14 pb-32">

        {/* Capacité & localisation */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Capacité & localisation" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Ces informations permettent aux couples de filtrer les lieux selon leurs besoins. Les champs sont facultatifs.
          </p>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/8 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                  Capacité minimum
                </label>
                <NumberInput value={form.capacityMin} onChange={v => set('capacityMin', v)} suffix="pers." />
              </div>
              <div>
                <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                  Capacité maximum
                </label>
                <NumberInput value={form.capacityMax} onChange={v => set('capacityMax', v)} suffix="pers." />
              </div>
              <div>
                <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                  Distance ville la plus proche
                </label>
                <NumberInput value={form.distanceToCity} onChange={v => set('distanceToCity', v)} suffix="min" />
              </div>
              <div>
                <label className="block font-manrope text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(78,26,50,0.4)' }}>
                  Ville la plus proche
                </label>
                <TextInput value={form.nearestCity} onChange={v => set('nearestCity', v)} placeholder="Ex. Reims" />
              </div>
            </div>
          )}
        </section>

        {/* Type de lieu */}
        <section className="mb-10 md:mb-14">
          <SectionHeader label="Type de lieu" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Sélectionnez tout ce qui correspond à votre lieu — plusieurs choix possibles.
          </p>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[80, 90, 70, 60, 80, 90].map((w, i) => (
                <div key={i} className="h-9 rounded-full bg-bordeaux/10 animate-pulse" style={{ width: w }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {VENUE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('venueType', form.venueType === value ? '' : value)}
                  className={[pillBase, form.venueType === value ? pillSelected : pillUnselected].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Équipements & services */}
        <section>
          <SectionHeader label="Équipements & services" />
          <p className="font-manrope text-[13px] mb-6" style={{ color: 'rgba(41,26,16,0.55)' }}>
            Cochez les équipements et services disponibles sur votre lieu.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 rounded-xl bg-bordeaux/8 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EQUIPMENT_FIELDS.map(({ key, label }) => (
                <CheckboxCard
                  key={key}
                  label={label}
                  checked={form[key] as boolean}
                  onChange={() => toggleBool(key)}
                />
              ))}
            </div>
          )}
        </section>

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
